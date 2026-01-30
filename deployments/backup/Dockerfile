FROM alpine:3.20

RUN apk add --no-cache \
    bash \
    ca-certificates \
    msmtp \
    postgresql-client \
    tzdata \
    aws-cli

WORKDIR /backup

COPY entrypoint.sh /backup/entrypoint.sh
COPY backup.sh /backup/backup.sh
COPY smoke.sh /backup/smoke.sh

RUN chmod +x /backup/entrypoint.sh /backup/backup.sh /backup/smoke.sh

ENV TZ=UTC

ENTRYPOINT ["/backup/entrypoint.sh"]
