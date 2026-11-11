@ConditionalOnClass(ObjectMapper.class)
@AutoConfigureBefore(JacksonAutoConfiguration.class)
@Configuration
class ObjectMapperAutoConfiguration {

    @ConditionalOnMissingBean
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.disable(WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(FAIL_ON_UNWRAPPED_TYPE_IDENTIFIERS);
        objectMapper.enable(READ_UNKNOWN_ENUM_VALUES_AS_NULL);
        return objectMapper;
    }
}