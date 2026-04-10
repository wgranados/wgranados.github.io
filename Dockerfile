FROM ruby:3.3

ENV BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    BUNDLE_APP_CONFIG=/usr/local/bundle \
    GEM_HOME=/usr/local/bundle \
    PATH=/usr/local/bundle/bin:$PATH

WORKDIR /srv/jekyll

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    git \
  && rm -rf /var/lib/apt/lists/*

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000 35729

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--livereload", "--livereload-port", "35729", "--incremental"]
