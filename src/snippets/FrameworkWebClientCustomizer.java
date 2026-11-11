@Component
class FrameworkWebClientCustomizer implements WebClientCustomizer {

    @Override
    void customize(WebClient.Builder webClientBuilder){
        webClientBuilder.filter(new DebugFilterFunction());
    }

}