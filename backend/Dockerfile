# Build stage
FROM maven:3.9-eclipse-temurin-25-alpine AS builder

WORKDIR /app

# Copy pom.xml first to leverage Docker cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S vwa && adduser -S vwa -G vwa
USER vwa

# Copy the jar from build stage
COPY --from=builder /app/target/*.jar app.jar

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Kích thước heap.
# -Xmx512m dễ OOM khi import Excel lớn: spring.servlet.multipart cho phép 10MB,
# hibernate.jdbc.batch_size=500 và cả 3 module import chạy cùng lúc giữ nhiều
# object trong bộ nhớ. 1g là mức tối thiểu hợp lý cho VPS 2GB.
# Override khi deploy nếu VPS nhỏ hơn:
#   docker compose build --build-arg JVM_MAX_HEAP=768m
ARG JVM_XMS=256m
ARG JVM_XMX=1g
ENV JAVA_TOOL_OPTIONS="-Xms${JVM_XMS} -Xmx${JVM_XMX}"

# Run as non-root user
ENTRYPOINT ["java", "-jar", "app.jar"]
