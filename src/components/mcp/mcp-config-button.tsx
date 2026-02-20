"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Code, ExternalLink, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface RuntimeConfig {
  wsUrl: string;
  apiUrl: string;
  authToken: string | null;
}

export function MCPConfigButton() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Failed to fetch config:", error);
        toast.error("Failed to load configuration");
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  // Determine MCP URL from the API URL
  const getMCPUrl = () => {
    if (!config?.apiUrl) {
      return "https://api.cloud.eggsplain.com/mcp";
    }
    const baseUrl = config.apiUrl.replace(/\/$/, "");
    return `${baseUrl}/mcp`;
  };

  const generateMCPConfig = (): string => {
    const mcpServerConfig = {
      command: "npx",
      args: [
        "-y",
        "mcp-remote",
        getMCPUrl(),
        "--header",
        "Authorization:${ADMIN_API_KEY}",
      ],
      env: {
        ADMIN_API_KEY: config?.authToken || "YOUR_API_KEY_HERE",
      },
    };

    return JSON.stringify({
      mcpServers: {
        Eggsplain: mcpServerConfig,
      },
    }, null, 2);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleCopyConfig = () => {
    const configJson = generateMCPConfig();
    copyToClipboard(configJson);
  };

  const handleShowConfig = () => {
    setShowDialog(true);
  };

  const getConfigFilePath = (editor: "cursor" | "vscode") => {
    const isWindows = typeof window !== "undefined" && navigator.platform.includes("Win");
    if (editor === "cursor") {
      return isWindows ? "%APPDATA%\\Cursor\\mcp.json" : "~/.cursor/mcp.json";
    }
    return isWindows ? "%APPDATA%\\Code\\User\\mcp.json" : "~/.vscode/mcp.json";
  };

  const handleCursorInstall = () => {
    if (!config?.authToken) {
      toast.error("No API token available");
      return;
    }

    const mcpServerConfig = {
      command: "npx",
      args: [
        "-y",
        "mcp-remote",
        getMCPUrl(),
        "--header",
        "Authorization:${ADMIN_API_KEY}",
      ],
      env: {
        ADMIN_API_KEY: config.authToken,
      },
    };

    const fullMCPConfig = {
      mcpServers: {
        Eggsplain: mcpServerConfig,
      },
    };

    const configJson = JSON.stringify(fullMCPConfig, null, 2);
    copyToClipboard(configJson);

    try {
      const configBase64 = btoa(JSON.stringify(mcpServerConfig));
      const configEncoded = encodeURIComponent(configBase64);
      const deepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=Eggsplain&config=${configEncoded}`;
      
      const link = document.createElement("a");
      link.href = deepLink;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Opening Cursor to install MCP server...", {
        description: "If Cursor doesn't open automatically, the config has been copied to your clipboard.",
        duration: 8000,
      });
    } catch (error) {
      const filePath = getConfigFilePath("cursor");
      toast.info("Config copied to clipboard!", {
        description: `Please paste it into ${filePath} and merge into existing mcpServers object.`,
        duration: 8000,
      });
    }
  };

  const handleVSCodeInstall = () => {
    if (!config?.authToken) {
      toast.error("No API token available");
      return;
    }

    const fullMCPConfig = {
      mcpServers: {
        Eggsplain: {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            getMCPUrl(),
            "--header",
            "Authorization:${ADMIN_API_KEY}",
          ],
          env: {
            ADMIN_API_KEY: config.authToken,
          },
        },
      },
    };

    const configJson = JSON.stringify(fullMCPConfig, null, 2);
    copyToClipboard(configJson);
    
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mcp.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            MCP Config
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Model Context Protocol</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCursorInstall}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Install in Cursor
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleVSCodeInstall}>
            <Code className="mr-2 h-4 w-4" />
            Install in VS Code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShowConfig}>
            <Settings className="mr-2 h-4 w-4" />
            View Config JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>MCP Configuration</DialogTitle>
            <DialogDescription>
              Add this configuration to your `mcp.json` to enable Eggsplain Meet
              tools in your AI editor.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Config JSON</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyConfig}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <Textarea
                readOnly
                className="font-mono text-xs h-[300px] resize-none"
                value={generateMCPConfig()}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Instructions</h4>
              <p className="text-sm text-muted-foreground">
                1. Open your editor's MCP configuration file.
              </p>
              <p className="text-sm text-muted-foreground pl-4 italic">
                {getConfigFilePath("cursor")} (Cursor)
                <br />
                {getConfigFilePath("vscode")} (VS Code)
              </p>
              <p className="text-sm text-muted-foreground">
                2. Copy the JSON above and merge it into your `mcpServers`
                object.
              </p>
              <p className="text-sm text-muted-foreground">
                3. Restart your editor to apply the changes.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
