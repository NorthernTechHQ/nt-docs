FROM --platform=$BUILDPLATFORM node:alpine AS build
ARG TARGETPLATFORM
WORKDIR /docs
ADD https://github.com/gohugoio/hugo/releases/download/v0.163.3/hugo_0.163.3_Linux-64bit.tar.gz hugo.tar.gz
RUN echo "ec422258f9a4ffc241de8707297e32311cd86fcc9b2813632617ff4d44935d91  hugo.tar.gz" | sha256sum -c
RUN tar -zxvf hugo.tar.gz && mv hugo /usr/local/bin/hugo
COPY ./ /docs
RUN npm ci
RUN npm run build:all
RUN hugo --logLevel info
RUN find public -type f -regex '^.*\.\(svg\|css\|html\|xml\|gif\)$' -size +1k -exec gzip -k '{}' \;

FROM nginx:stable-alpine
RUN apk add --no-cache nodejs npm
RUN npm i -g forever
COPY --from=build /docs/redirects.txt /etc/nginx/conf.d/
COPY --from=build /docs/public /usr/share/nginx/html
COPY --from=build /docs/scripts/search /usr/share/search
COPY ./entrypoint.sh /entrypoint.sh
COPY ./nginx.conf /etc/nginx/nginx.conf
ENTRYPOINT /entrypoint.sh
