FROM richarvey/nginx-php-fpm
MAINTAINER Remi Cattiau <remi@cattiau.com>

# Import built website
RUN rm -rf /usr/share/nginx/html/*
ADD dist/ /usr/share/nginx/html/
RUN chown -Rf www-data.www-data /usr/share/nginx/html/
# Dont use index.php as index
RUN sed -i 's/index index.php index./index index./g' /etc/nginx/sites-available/default.conf 
