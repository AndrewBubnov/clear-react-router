class RouterConfig {
	isAnimated = false;
	showFallbackIfAnimated = false;
	configure(config: Partial<RouterConfig>) {
		Object.assign(this, config);
	}
}

export const routerConfig = new RouterConfig();
