FROM --platform=$BUILDPLATFORM ghcr.io/gohugoio/hugo:v0.169.0@sha256:a146e0639230bbc73358e6563240f0a6103466f0390b80a457c775068ec802a9 AS build
ARG TARGETPLATFORM
WORKDIR /docs
COPY --chown=hugo:hugo ./ /docs
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
