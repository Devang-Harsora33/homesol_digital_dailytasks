"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DailyTasks } from "@/components/panels/DailyTasks";
import { Calendar } from "@/components/panels/Calendar";
import { Messages } from "@/components/panels/Messages";
import { Contacts } from "@/components/panels/Contacts";
import { Report } from "@/components/panels/Report";
import { Stats } from "@/components/panels/Stats";
import { Mistakes } from "@/components/panels/Mistakes";
import { Agent } from "@/components/panels/Agent";

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState("days");

  const renderPanel = () => {
    switch (activePanel) {
      case "days": return <DailyTasks />;
      case "calendar": return <Calendar />;
      case "messages": return <Messages />;
      case "contacts": return <Contacts />;
      case "stats": return <Stats />;
      case "report": return <Report />;
      case "mistakes": return <Mistakes />;
      case "agent": return <Agent />;
      default: return <DailyTasks />;
    }
  };

  return (
    <>
      {/* TOAST will be a global implementation later if needed, left out for brevity */}
      <Header />
      
      <div className="layout" style={{ display: 'flex', height: 'calc(100vh - 61px)' }}>
        <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
        
        <div className="main" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {renderPanel()}
        </div>
      </div>
    </>
  );
}
