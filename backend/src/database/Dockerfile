FROM influxdb:2.7

COPY scripts/influxdb-prestart.sh /usr/local/bin/influxdb-prestart.sh
RUN chmod +x /usr/local/bin/influxdb-prestart.sh

ENTRYPOINT ["/usr/local/bin/influxdb-prestart.sh"]
