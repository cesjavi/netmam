FROM rust:1.82-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app
COPY --from=builder /app/target/release/rust-socket-server /app/netplay-server

ENV PORT=3000
EXPOSE 3000

CMD ["/app/netplay-server"]
