package com.example.ecommerce.service;

import com.example.ecommerce.dto.AuthResponse;
import com.example.ecommerce.dto.LoginRequest;
import com.example.ecommerce.dto.RegisterRequest;
import com.example.ecommerce.model.UserProfile;
import com.example.ecommerce.repository.UserProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

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
        user.setRole("User");
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
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = tokenProvider.createToken(user.getEmail(), user.getUid());
        return new AuthResponse(token, user.getUid());
    }
}
