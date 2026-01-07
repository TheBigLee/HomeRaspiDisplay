FROM nginx:alpine

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Create necessary directories and set permissions
RUN mkdir -p /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    chown -R appuser:appuser /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Copy custom nginx configuration
COPY --chown=appuser:appuser nginx.conf /etc/nginx/nginx.conf

# Copy application files
COPY --chown=appuser:appuser index.html /usr/share/nginx/html/
COPY --chown=appuser:appuser dashboard.html /usr/share/nginx/html/
COPY --chown=appuser:appuser app.js /usr/share/nginx/html/
COPY --chown=appuser:appuser style.css /usr/share/nginx/html/

# Copy entrypoint script
COPY --chown=appuser:appuser docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Expose non-privileged port
EXPOSE 8080

# Set default environment variables
ENV STATIONS="Zürich HB"
ENV GRAFANA_URL_1="https://grafana.example.com/d-solo/dashboard1"
ENV GRAFANA_URL_2="https://grafana.example.com/d-solo/dashboard2"

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
