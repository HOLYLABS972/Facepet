/**
 * Page Plugin System
 * Breaks large pages into composable plugins to reduce page file size
 * Each plugin handles specific functionality (hero, features, etc)
 */

export interface PagePlugin {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  enabled: boolean;
  order: number;
}

export interface PagePluginConfig {
  plugins: PagePlugin[];
  layout?: 'vertical' | 'horizontal';
}

/**
 * Plugin Registry
 */
export class PluginRegistry {
  private plugins: Map<string, PagePlugin> = new Map();

  register(plugin: PagePlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): PagePlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): PagePlugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.order - b.order);
  }

  enable(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin) plugin.enabled = true;
  }

  disable(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin) plugin.enabled = false;
  }
}

/**
 * Page Plugin Renderer
 */
export interface PluginRendererProps {
  plugins: PagePlugin[];
  props?: Record<string, any>;
}

export const PluginRenderer = ({ plugins, props = {} }: PluginRendererProps) => {
  return (
    <>
      {plugins.map((plugin) => {
        const Component = plugin.component;
        return (
          <Component key={plugin.id} {...props} />
        );
      })}
    </>
  );
};
