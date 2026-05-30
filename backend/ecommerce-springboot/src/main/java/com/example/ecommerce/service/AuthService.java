package com.example.ecommerce.service;

import com.example.ecommerce.dto.AuthResponse;
import com.example.ecommerce.dto.LoginRequest;
import com.example.ecommerce.dto.RegisterRequest;
import com.example.ecommerce.model.UserProfile;
import com.example.ecommerce.repository.UserProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserProfileRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserProfileRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        UserProfile user = new UserProfile();
        user.setUid(java.util.UUID.randomUUID().toString());
        user.setEmail(request.getEmail());
        user.setDisplayName(request.getName());
        user.setRole(request.getRole() != null && !request.getRole().isBlank() ? request.getRole() : "customer");
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setWalletBalance(java.math.BigDecimal.ZERO);
        userRepository.save(user);

        String token = tokenProvider.createToken(user.getEmail(), user.getUid());
        return new AuthResponse(token, user.getUid());
    }

    public AuthResponse login(LoginRequest request) {
        Optional<UserProfile> opt = userRepository.findByEmail(request.getEmail());
        if (opt.isEmpty()) throw new IllegalArgumentException("Invalid credentials");
        UserProfile user = opt.get();
        String storedHash = user.getPasswordHash();
        boolean matches = false;
        if (storedHash == null) {
            matches = false;
        } else if (storedHash.startsWith("$2") || storedHash.startsWith("{bcrypt}")) {
            // stored as BCrypt
            matches = passwordEncoder.matches(request.getPassword(), storedHash);
        } else {
            // legacy plain-text or non-BCrypt hash from migration (e.g., Firebase).
            // allow login by direct equality, then upgrade to BCrypt for future logins.
            if (storedHash.equals(request.getPassword())) {
                matches = true;
                // upgrade stored password to BCrypt
                try {
                    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                    userRepository.save(user);
                } catch (Exception ignore) {
                    // non-fatal; continue with successful auth
                }
            } else {
                matches = false;
            }
        }

        if (!matches) {
            log.warn("Login failed for email={}: invalid credentials", request.getEmail());
            throw new IllegalArgumentException("Invalid credentials");
        }

        log.info("Login successful for email={}", request.getEmail());
        String token = tokenProvider.createToken(user.getEmail(), user.getUid());
        return new AuthResponse(token, user.getUid());
    }
}
