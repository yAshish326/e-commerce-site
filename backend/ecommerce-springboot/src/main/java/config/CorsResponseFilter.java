package config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsResponseFilter implements Filter {

    private static final String FRONTEND_ORIGIN = "http://localhost:4200";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String origin = req.getHeader("Origin");
        // simple log to verify filter execution during troubleshooting
        System.out.println("[CorsResponseFilter] " + req.getMethod() + " " + req.getRequestURI() + " Origin=" + origin);
        if (origin != null && origin.contains("localhost:4200")) {
            res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
            res.setHeader("Vary", "Origin");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Cache-Control, Content-Type");
        }

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            res.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(request, response);
    }
}
