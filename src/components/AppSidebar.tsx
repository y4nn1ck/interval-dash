import { LayoutDashboard, BarChart3, FileSearch, Binary } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Tableau de bord",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Power Compar",
    url: "/power-compar",
    icon: BarChart3,
  },
  {
    title: "FIT Analyzer",
    url: "/fit-analyzer",
    icon: FileSearch,
  },
  {
    title: "FIT Raw Reader",
    url: "/fit-raw-reader",
    icon: Binary,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar/80 backdrop-blur-xl">
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem 
                    key={item.title}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link 
                        to={item.url}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                          "hover:bg-accent/50 hover:text-accent-foreground",
                          isActive 
                            ? "bg-primary/10 text-primary shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {/* Active indicator */}
                        <span 
                          className={cn(
                            "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300",
                            isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
                          )}
                        />
                        
                        {/* Icon with glow effect on active */}
                        <item.icon 
                          className={cn(
                            "h-5 w-5 shrink-0 transition-all duration-300",
                            isActive 
                              ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" 
                              : "text-muted-foreground group-hover:text-foreground"
                          )} 
                        />
                        
                        {/* Text with gradient on active */}
                        <span 
                          className={cn(
                            "transition-all duration-300",
                            isActive && "bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent"
                          )}
                        >
                          {item.title}
                        </span>
                        
                        {/* Hover glow effect */}
                        <span 
                          className={cn(
                            "absolute inset-0 -z-10 rounded-lg opacity-0 transition-opacity duration-300",
                            "bg-gradient-to-r from-primary/5 to-accent/5",
                            "group-hover:opacity-100"
                          )}
                        />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
