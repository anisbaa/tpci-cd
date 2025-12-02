 FROM nginx:alpine
 # Copier les fichiers dans le r é pertoire nginx
 COPY index.html /usr/share/nginx/html/
 COPY style.css /usr/share/nginx/html/
 EXPOSE 80
 CMD ["nginx", "-g", "daemon off;"]