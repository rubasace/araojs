@Configuration
class MetricsAutoConfiguration {

    @Order(Ordered.HIGHEST_PRECEDENCE)
    @Bean
    MeterFilter customBucketsServerMeterFilter() {
        return new CustomBucketsServerMeterFilter();
    }
}