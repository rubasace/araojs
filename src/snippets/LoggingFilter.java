@Component
public class LoggingFilter implements Filter {

    @Override
    public void doFilter(final ServletRequest servletRequest,
                         final ServletResponse servletResponse,
                         final FilterChain filterChain) {
        logRequest(servletRequest);
        filterChain.doFilter(servletRequest, servletResponse);
        logResponse(servletResponse);
    }
    //...
}