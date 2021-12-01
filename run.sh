#! /bin/zsh

podman rm -f nr
podman run --env-file .env -p 1882:1880 --name nr --rm nrce