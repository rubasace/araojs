@Component
class FrameworkRestTemplateCustomizer implements RestTemplateCustomizer {

    @Override
    void customize(RestTemplate restTemplate){
        restTemplate.getInterceptors().add(new DebugInterceptor());
        restTemplate.getInterceptors().add(new LoggingInterceptor());
    }

}