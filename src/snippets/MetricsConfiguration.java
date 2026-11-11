@Configuration
class MetricsConfiguration {

    @Bean
    MeterBinder processMemoryMetrics() {
        return new ProcessMemoryMetrics();
    }

    @Order(Ordered.HIGHEST_PRECEDENCE)
    @Bean
    MeterFilter customBucketsServerMeterFilter() {
        return new CustomBucketsServerMeterFilter();
    }
}