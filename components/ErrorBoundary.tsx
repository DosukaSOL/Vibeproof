/**
 * Global Error Boundary
 * Catches JS render errors and shows them instead of crashing the app.
 */
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#0D1117",
            padding: 24,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#F85149",
              marginBottom: 12,
            }}
          >
            Something went wrong
          </Text>
          <ScrollView
            style={{
              maxHeight: 300,
              backgroundColor: "#161B22",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: "#E6EDF3", fontFamily: "monospace" }}>
              {this.state.error?.toString()}
            </Text>
            {this.state.errorInfo?.componentStack && (
              <Text
                style={{
                  fontSize: 11,
                  color: "#8B949E",
                  marginTop: 8,
                  fontFamily: "monospace",
                }}
              >
                {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: "#3FB950",
              paddingVertical: 12,
              borderRadius: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
