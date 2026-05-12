# ecommerce-springboot

Prototype Spring Boot backend for the E-Commerce app (Auth + Products).

Run locally:

```
mvnw spring-boot:run
```

Server runs on port 8081 and uses H2 in-memory DB for the prototype.

Quick curl examples:

- Register:

```bash
curl -X POST http://localhost:8081/api/auth/register \
	-H "Content-Type: application/json" \
	-d '{"name":"Test","email":"test@example.com","password":"pass123"}'
```

- Login:

```bash
curl -X POST http://localhost:8081/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"test@example.com","password":"pass123"}'
```

- Create product (use token from login response):

```bash
curl -X POST http://localhost:8081/api/products \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <TOKEN>" \
	-d '{"name":"Sample","description":"Nice","price":9.99}'
```

- List products (authorized):

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8081/api/products
```

