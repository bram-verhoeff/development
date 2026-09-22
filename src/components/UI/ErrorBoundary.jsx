import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isWebGLSupported: true };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
                 !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
      if (!gl) {
        this.setState({ isWebGLSupported: false });
      }
    } catch (e) {
      this.setState({ isWebGLSupported: false });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('webglcontextlost', this.handleContextLost);
    window.removeEventListener('webglcontextrestored', this.handleContextRestored);
  }

  handleContextLost = (e) => {
    e.preventDefault();
    console.warn('WebGL Context Lost. Awaiting restoration...');
    this.setState({ hasError: true, error: new Error('WebGL Graphics Context Lost') });
  };

  handleContextRestored = () => {
    console.info('WebGL Context Restored. Reloading scene...');
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    try {
      localStorage.removeItem('fps_graphics_quality');
      localStorage.removeItem('fps_enable_reflections');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (!this.state.isWebGLSupported) {
      return (
        <div className="error-fallback-screen" style={{ background: '#07090b', color: '#e2e8f0' }}>
          <AlertTriangle size={48} color="#ff3344" />
          <h2>HARDWARE ACCELERATION REQUIRED</h2>
          <p>WebGL 2.0 is not supported or is disabled in your browser settings.</p>
          <button className="hud-button" onClick={this.handleReload}>
            <RefreshCw size={16} /> RETRY INITIALIZATION
          </button>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="error-fallback-screen" style={{ background: '#07090b', color: '#e2e8f0' }}>
          <AlertTriangle size={48} color="#ff9900" />
          <h2>SIMULATION ENGINE EXCEPTION</h2>
          <p>{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button className="hud-button" onClick={this.handleReload}>
            <RefreshCw size={16} /> REBOOT SIMULATION (SAFE MODE)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
