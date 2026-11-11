@Component
public class DebugFilter implements Filter {

    @Override
    public void doFilter(final ServletRequest servletRequest,
                         final ServletResponse servletResponse,
                         final FilterChain filterChain) {
        if (isDebug(servletRequest)) {
            MDC.put(DEBUG_FLAG, "true");
        }
        filterChain.doFilter(servletRequest, servletResponse);
    }
    //...
}