FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html privacy.html /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY data/ /usr/share/nginx/html/data/
COPY assets/ /usr/share/nginx/html/assets/
COPY Images/ /usr/share/nginx/html/Images/

EXPOSE 80
