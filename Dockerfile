# Production Dockerfile for Render Deployment
# Ethan McClarence Gacud Portfolio (PHP 8.2 + Apache)

FROM php:8.2-apache

# 1. Install system utilities & PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && docker-php-ext-install pdo pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Enable Apache rewrite & headers modules
RUN a2enmod rewrite headers

# 3. Configure production PHP settings
RUN { \
    echo "expose_php = Off"; \
    echo "display_errors = Off"; \
    echo "display_startup_errors = Off"; \
    echo "log_errors = On"; \
    echo "error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT"; \
    echo "session.cookie_httponly = 1"; \
    echo "session.cookie_samesite = 'Lax'"; \
    echo "session.use_strict_mode = 1"; \
    echo "upload_max_filesize = 10M"; \
    echo "post_max_size = 12M"; \
} > /usr/local/etc/php/conf.d/production.ini

# 4. Copy project files into web root
WORKDIR /var/www/html
COPY . /var/www/html/

# 5. Set proper file ownership and permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# 6. Render dynamic PORT configuration entrypoint
# Render assigns a dynamic port via the $PORT environment variable (default: 80)
EXPOSE 80 10000

CMD ["sh", "-c", "sed -i \"s/80/${PORT:-80}/g\" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf && apache2-foreground"]
