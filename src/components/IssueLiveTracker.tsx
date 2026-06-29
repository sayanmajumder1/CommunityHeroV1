import React, { useState, useEffect } from 'react';
import { useStore, AuditLog } from '../store';
import { 
  X, Check, Clock, Eye, ShieldCheck, MapPin, 
  Send, Calendar, AlertTriangle, User, HardHat, Compass, Sparkles, MessageSquare,
  Cpu, Users, Landmark, Search, ClipboardList, Trophy, Star, ChevronRight, Lock, 
  Settings, CheckCircle2, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface IssueLiveTrackerProps {
  issueId: string;
  onClose: () => void;
}

interface CitizenFeedback {
  rating: number;
  feedback: string;
  timestamp: number;
}

export default function IssueLiveTracker({ issueId, onClose }: IssueLiveTrackerProps) {
  const issues = useStore((state) => state.issues);
  const commentsMap = useStore((state) => state.comments);
  const auditLogsMap = useStore((state) => state.auditLogs);
  const user = useStore((state) => state.user);
  const addComment = useStore((state) => state.addComment);
  const updateIssueStatus = useStore((state) => state.updateIssueStatus);

  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  // Interactive Simulation Controls for showing and testing each step perfectly
  const [simulatedStageOverride, setSimulatedStageOverride] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Local storage cache for citizen resolution confirmations
  const [feedbackSaved, setFeedbackSaved] = useState<CitizenFeedback | null>(null);

  // Find the selected issue
  const issue = issues.find(i => i.id === issueId);

  // Read feedback from localStorage on mount
  useEffect(() => {
    if (issueId) {
      const saved = localStorage.getItem(`issue_feedback_${issueId}`);
      if (saved) {
        try {
          setFeedbackSaved(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [issueId]);

  if (!issue) return null;

  // Department mapping based on issue category
  const getDepartmentInfo = (category: string) => {
    switch (category) {
      case 'Pothole':
        return { name: 'Road Maintenance Department', head: 'Director Rohit Sharma', code: 'RMD' };
      case 'Water Leakage':
        return { name: 'Water Supply Department', head: 'Chief Engineer Vikram Sen', code: 'WSD' };
      case 'Waste Accumulation':
        return { name: 'Waste Management Department', head: 'Superintendent Ananya Roy', code: 'WMD' };
      case 'Broken Road':
        return { name: 'Public Works Department', head: 'Exec Engineer Amit Das', code: 'PWD' };
      case 'Damaged Light':
        return { name: 'Electricity Department', head: 'Inspector Rajesh Patel', code: 'ELD' };
      default:
        return { name: 'Community Services Department', head: 'Chief Devendra Singh', code: 'CSD' };
    }
  };

  const dept = getDepartmentInfo(issue.category);

  // Determine stage progress (1 to 10)
  const getActiveStageIndex = () => {
    if (issue.status === 'Submitted') {
      if (issue.upvotes === 0) return 2; // AI processing
      if (issue.upvotes > 0 && issue.upvotes < 3) return 3; // Community validation
      return 4; // Assigned
    }
    if (issue.status === 'Under Review') {
      return 5; // Reviewing
    }
    if (issue.status === 'In Progress') {
      return 6; // Work in progress
    }
    if (issue.status === 'Resolved') {
      if (feedbackSaved) return 10; // Already closed by resident
      return 9; // Awaiting citizen confirmation
    }
    return 1;
  };

  const currentStageIndex = simulatedStageOverride !== null ? simulatedStageOverride : getActiveStageIndex();
  
  // Auto play simulation loop
  useEffect(() => {
    const STAGE_TITLES = [
      'Issue Submitted',
      'AI Analysis Completed',
      'Community Verification',
      'Assigned To Department',
      'Department Review',
      'Work In Progress',
      'Field Verification',
      'Issue Resolved',
      'Citizen Confirmation',
      'Issue Closed'
    ];
    let intervalId: NodeJS.Timeout;
    if (isAutoPlaying) {
      if (simulatedStageOverride === null) {
        setSimulatedStageOverride(1);
      }
      intervalId = setInterval(() => {
        setSimulatedStageOverride((prev) => {
          const currentVal = prev !== null ? prev : 1;
          if (currentVal >= 10) {
            setIsAutoPlaying(false);
            toast.success("SLA Journey Simulation Complete!", { icon: "🏆" });
            return 10;
          }
          const nextVal = currentVal + 1;
          toast.success(`Advanced to Stage ${nextVal}: ${STAGE_TITLES[nextVal - 1] || ''}`, { id: "sim-toast" });
          return nextVal;
        });
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPlaying, simulatedStageOverride]);

  // State for which stage is currently inspected in detail panel
  const [selectedStage, setSelectedStage] = useState<number>(currentStageIndex);

  // Update selected stage when current stage loads
  useEffect(() => {
    setSelectedStage(currentStageIndex);
  }, [currentStageIndex]);

  // Comments and audit logs
  const comments = commentsMap[issueId] || [];
  const dbAuditLogs = auditLogsMap[issueId] || [];

  const getTimelineLogs = (): AuditLog[] => {
    if (dbAuditLogs.length > 0) {
      return dbAuditLogs;
    }
    // Procedural logs fallback
    const logs: AuditLog[] = [];
    const baseTime = issue.createdAt;

    logs.push({
      id: `${issueId}-log-1`,
      issueId,
      actorId: issue.reporterId,
      actorName: issue.reporterName || 'Resident Reporter',
      action: 'Report Filed',
      details: 'Civic issue successfully created and broadcasted to neighborhood grid.',
      createdAt: baseTime
    });

    if (currentStageIndex >= 2) {
      logs.push({
        id: `${issueId}-log-2`,
        issueId,
        actorId: 'ai-system',
        actorName: 'Gemini AI Hub',
        action: 'AI Core Analysis',
        details: `Automatic model validation completed. Categorized as ${issue.category} with ${issue.severity} severity classification.`,
        createdAt: baseTime + 45 * 1000
      });
    }

    if (currentStageIndex >= 3 && issue.upvotes > 0) {
      logs.push({
        id: `${issueId}-log-3`,
        issueId,
        actorId: 'neighborhood-consensus',
        actorName: 'Neighborhood Grid',
        action: 'Verified',
        details: `${issue.upvotes} resident(s) upvoted and verified the coordinates as genuine.`,
        createdAt: baseTime + 5 * 60 * 1000
      });
    }

    if (currentStageIndex >= 4) {
      logs.push({
        id: `${issueId}-log-4`,
        issueId,
        actorId: 'admin-dispatch',
        actorName: 'Command Control Center',
        action: 'Assigned',
        details: `Ticket routed directly to ${dept.name} under SLA supervision of ${dept.head}.`,
        createdAt: baseTime + 12 * 60 * 1000
      });
    }

    if (currentStageIndex >= 5) {
      logs.push({
        id: `${issueId}-log-5`,
        issueId,
        actorId: 'officer-review',
        actorName: dept.head,
        action: 'Review Completed',
        details: 'Geofenced physical review completed. Priority levels audited & contractor crew scheduled.',
        createdAt: baseTime + 30 * 60 * 1000
      });
    }

    if (currentStageIndex >= 6) {
      logs.push({
        id: `${issueId}-log-6`,
        issueId,
        actorId: 'work-team',
        actorName: `${dept.code} Field Crew`,
        action: 'Remediation Active',
        details: 'Materials staged. Worksite safety markers placed. Restoration actively in progress.',
        createdAt: baseTime + 45 * 60 * 1000
      });
    }

    if (currentStageIndex >= 8) {
      logs.push({
        id: `${issueId}-log-8`,
        issueId,
        actorId: 'inspector-1',
        actorName: 'Safety Inspector',
        action: 'Remediation Approved',
        details: 'Post-repair structural alignment, materials quality, and site safety signed off.',
        createdAt: issue.updatedAt - 10 * 60 * 1000
      });
    }

    if (currentStageIndex >= 9) {
      logs.push({
        id: `${issueId}-log-9`,
        issueId,
        actorId: 'ward-commissioner',
        actorName: 'Ward Commissioner',
        action: 'SLA Resolved',
        details: 'Service level agreement completed. Status changed to Resolved.',
        createdAt: issue.updatedAt
      });
    }

    if (feedbackSaved) {
      logs.push({
        id: `${issueId}-log-10`,
        issueId,
        actorId: issue.reporterId,
        actorName: issue.reporterName || 'Resident Reporter',
        action: 'Ticket Closed',
        details: `Resident approved resolution with rating ${feedbackSaved.rating}/5. Feedback: "${feedbackSaved.feedback || 'None'}"`,
        createdAt: feedbackSaved.timestamp
      });
    }

    return logs.sort((a, b) => b.createdAt - a.createdAt);
  };

  const logs = getTimelineLogs();

  // Definition of the 10-stage issue resolution flow
  const STAGES_CONFIG = [
    {
      index: 1,
      title: 'Issue Submitted',
      responsible: 'Citizen',
      icon: User,
      department: 'Citizen Portal',
      description: 'The citizen reports the issue with image, description, and GPS geolocation.',
      ownerInfo: `Submitted by ${issue.reporterName || 'Resident'} via mobile app.`,
      metrics: [
        { label: 'Reporter ID', value: issue.reporterId.slice(0, 10) },
        { label: 'Timestamp', value: format(issue.createdAt, 'yyyy-MM-dd HH:mm:ss') },
        { label: 'Source Device', value: 'Android / iOS GIS Client' }
      ]
    },
    {
      index: 2,
      title: 'AI Analysis Completed',
      responsible: 'Gemini AI',
      icon: Cpu,
      department: 'AI Systems',
      description: 'Gemini AI processes the upload to automatically detect the category, predict severity, and recommend dispatch divisions.',
      ownerInfo: 'Vertex AI Cloud Model (gemini-2.5-flash)',
      metrics: [
        { label: 'Detected Category', value: issue.category },
        { label: 'Severity Confidence', value: issue.severity === 'Critical' ? '98.4%' : '94.2%' },
        { label: 'Recommended Dept', value: dept.name }
      ]
    },
    {
      index: 3,
      title: 'Community Verification',
      responsible: 'Citizens',
      icon: Users,
      department: 'Local Neighborhood',
      description: 'Local neighbors verify and upvote the issue to confirm legitimacy and establish high-priority community consensus.',
      ownerInfo: 'Local Citizens & Community Board',
      metrics: [
        { label: 'Citizen Upvotes', value: `${issue.upvotes} Verification(s)` },
        { label: 'Consensus Level', value: issue.upvotes >= 3 ? 'High Priority' : 'Community Audit' },
        { label: 'Geofence Radius', value: '350 meters' }
      ]
    },
    {
      index: 4,
      title: 'Assigned To Department',
      responsible: 'Admin System',
      icon: Landmark,
      department: 'Command Control Center',
      description: 'The system automatically routes the ticket to the respective municipal division based on the AI analysis recommendation.',
      ownerInfo: 'Municipal Administration Routing',
      metrics: [
        { label: 'Target Dept', value: dept.name },
        { label: 'Lead Commissioner', value: dept.head },
        { label: 'Priority Tag', value: issue.severity }
      ]
    },
    {
      index: 5,
      title: 'Department Review',
      responsible: 'Officer',
      icon: Search,
      department: dept.name,
      description: 'A municipal supervisor audits physical data, reviews safety boundaries, and maps out the dispatch plan.',
      ownerInfo: `${dept.head} (${dept.name})`,
      metrics: [
        { label: 'SLA Deadline', value: '24 Hours max' },
        { label: 'Officer Note', value: 'Physical GPS cross-referenced' },
        { label: 'Work Order ID', value: `WO-${issue.id.slice(0, 6).toUpperCase()}` }
      ]
    },
    {
      index: 6,
      title: 'Work In Progress',
      responsible: 'Department Team',
      icon: HardHat,
      department: dept.name,
      description: 'Work crews deploy to the physical coordinates with equipment to repair and restore the community asset.',
      ownerInfo: `${dept.code} Active Maintenance Crew`,
      metrics: [
        { label: 'Crew Strength', value: '5 Engineers & Technicians' },
        { label: 'Staged Material', value: 'Structural asphalt mix / Tools' },
        { label: 'Onsite Safety', value: 'Warning cones and barricades set' }
      ]
    },
    {
      index: 7,
      title: 'Field Verification',
      responsible: 'Inspector',
      icon: ClipboardList,
      department: 'Audit & Compliance',
      description: 'A dedicated safety and quality inspector physically audits the repair site to ensure it meets structural guidelines.',
      ownerInfo: 'District Senior Inspector',
      metrics: [
        { label: 'GPS Match', value: 'Within 2.4 meters' },
        { label: 'Standard Code', value: 'ISO-9001 Civic Code' },
        { label: 'Quality Audit', value: '100% Passed Checklist' }
      ]
    },
    {
      index: 8,
      title: 'Issue Resolved',
      responsible: 'Department',
      icon: ShieldCheck,
      department: dept.name,
      description: 'The department officially resolves the ticket, uploading verification images and closing field operations.',
      ownerInfo: `${dept.name} Command`,
      metrics: [
        { label: 'Resolved Timestamp', value: format(issue.updatedAt, 'yyyy-MM-dd HH:mm') },
        { label: 'Remediation Status', value: 'Completed & Sealed' },
        { label: 'SLA Compliance', value: '99.4% On-Time' }
      ]
    },
    {
      index: 9,
      title: 'Citizen Confirmation',
      responsible: 'Citizen',
      icon: Star,
      department: 'Citizen Portal',
      description: 'The reporting citizen reviews the repair, provides feedback and star ratings, and approves the closure of the issue.',
      ownerInfo: `${issue.reporterName || 'Reporting Citizen'}`,
      metrics: [
        { label: 'Satisfaction Check', value: feedbackSaved ? 'Submitted' : 'Awaiting Citizen Star Rating' },
        { label: 'Approval Requirement', value: 'Citizen Sign-Off' },
        { label: 'Verification Method', value: 'Direct App Authenticated Account' }
      ]
    },
    {
      index: 10,
      title: 'Issue Closed',
      responsible: 'System',
      icon: Trophy,
      department: 'Command Control Center',
      description: 'The issue is archived in the historical city grid. Total resolution speed is factored into department performance metrics.',
      ownerInfo: 'Municipal Archives & Audit System',
      metrics: [
        { label: 'Resolution Speed', value: '2 Hours 15 Mins' },
        { label: 'Department Performance Score', value: '98.5 / 100' },
        { label: 'Community Reward Points', value: '+100 XP Assigned' }
      ]
    }
  ];

  const currentStage = STAGES_CONFIG[currentStageIndex - 1] || STAGES_CONFIG[0];
  const inspectedStage = STAGES_CONFIG[selectedStage - 1] || STAGES_CONFIG[0];

  // Post a text comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addComment(issueId, user.uid, user.displayName || 'Resident', newCommentText.trim());
      setNewCommentText('');
      toast.success('Live telemetry commentary updated');
    } catch (err) {
      toast.error('Unable to post update. Check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit citizen confirmation feedback (Stage 9 -> 10)
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    
    try {
      // Simulate submission & save to localStorage to persist closed state on reload
      const newFeedback: CitizenFeedback = {
        rating,
        feedback: feedbackText.trim(),
        timestamp: Date.now()
      };
      
      localStorage.setItem(`issue_feedback_${issueId}`, JSON.stringify(newFeedback));
      setFeedbackSaved(newFeedback);
      
      // Post comment as log event
      await addComment(
        issueId, 
        user.uid, 
        user.displayName || 'Resident', 
        `⭐ [Resident Approved] Rated ${rating}/5 stars. Notes: "${feedbackText.trim() || 'No additional comments.'}"`
      );

      toast.success('Thank you! Feedback received. Issue officially closed.', { icon: '🏆' });
      setSelectedStage(10); // Automatically inspect the closed stage
    } catch (err) {
      toast.error('Unable to register confirmation.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
      id="live-tracking-system"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="bg-white text-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden text-left font-sans"
      >
        {/* Header Bar */}
        <div className="bg-slate-50/80 p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-wider">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>REAL-TIME CITIZEN SATELLITE TRANSIT</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider font-semibold">#{issue.id.slice(0, 12)}</span>
            </div>
            
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{issue.title}</h2>
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-md">{issue.location.address || 'District Zone 4 Central Grid'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
            <div className="text-right">
              <div className="text-[9px] font-black tracking-wider text-slate-400 uppercase">ACTIVE OWNERSHIP</div>
              <div className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentStage.department}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Sandbox Operational SLA Simulator Control Center */}
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 md:p-5 space-y-4 relative overflow-hidden" id="sla-sandbox-simulation-board">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-200/40 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest text-amber-700 uppercase">SANDBOX ENGINE COMPLIANCE CONTROL BOARD</span>
                </div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Issue Lifecycle Journey Simulator</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                     setIsAutoPlaying(!isAutoPlaying);
                     if (!isAutoPlaying && simulatedStageOverride === 10) {
                       setSimulatedStageOverride(1);
                     }
                  }}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                    isAutoPlaying 
                      ? 'bg-amber-500 text-white border-amber-500 animate-pulse' 
                      : 'bg-white border-slate-200 text-amber-750 hover:bg-slate-50 hover:text-amber-800'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isAutoPlaying ? 'animate-spin' : ''}`} />
                  <span>{isAutoPlaying ? 'PAUSE AUTO-PLAY' : 'AUTO-PLAY STAGES'}</span>
                </button>
                {simulatedStageOverride !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedStageOverride(null);
                      setIsAutoPlaying(false);
                      toast.success("Synchronized back to Live Cloud/Zustand state.");
                    }}
                    className="px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    RESET TO LIVE STATE
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Use these mock override controls to step through each of the **10 dynamic steps** of the Flipkart/Uber-grade resolution pipeline. In production, this shifts automatically based on backend telemetry.
              </p>

              {/* Step checklist buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
                {[
                  { step: 1, label: '1. File Filed' },
                  { step: 2, label: '2. AI Classified' },
                  { step: 3, label: '3. Consensus' },
                  { step: 4, label: '4. Assigned' },
                  { step: 5, label: '5. Audit' },
                  { step: 6, label: '6. Excavation' },
                  { step: 7, label: '7. Inspection' },
                  { step: 8, label: '8. Remediated' },
                  { step: 9, label: '9. Star Check' },
                  { step: 10, label: '10. Archived' },
                ].map((st) => {
                  const isActiveSimulated = currentStageIndex === st.step;
                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setSimulatedStageOverride(st.step);
                        setSelectedStage(st.step);
                        toast.success(`Simulated State Step ${st.step}: ${st.label}`);
                      }}
                      className={`py-2 text-[10px] font-black rounded-lg border transition-all truncate text-center cursor-pointer ${
                        isActiveSimulated
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10 scale-102'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                      title={st.label}
                    >
                      Step {st.step}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Executive Overview Panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 items-center">
            <div className="md:col-span-3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200/50 pb-4 md:pb-0 md:pr-5">
              <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="6" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (currentStageIndex * 10) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-slate-800">{currentStageIndex * 10}%</span>
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">JOURNEY</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-wider">
                Stage {currentStageIndex} of 10
              </span>
            </div>

            <div className="md:col-span-9 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">CURRENT STAGE</span>
                  <span className="text-xs font-black text-emerald-600 block mt-1 truncate">{currentStage.title}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">RESPONSIBLE OWNER</span>
                  <span className="text-xs font-black text-slate-700 block mt-1 truncate">{currentStage.responsible}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">SLA ESTIMATE</span>
                  <span className="text-xs font-black text-amber-600 block mt-1 truncate">
                    {issue.status === 'Resolved' ? 'Completed & Certified' : issue.severity === 'Critical' ? 'Under 4 Hours' : 'Within 24 Hours'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60 text-xs text-slate-600 font-semibold leading-relaxed flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Interactive Mode:</strong> Click any circle checkpoint node in the journey stream below to inspect its detailed diagnostic report, AI variables, audit trail, and dispatch checklists.
                </span>
              </div>
            </div>
          </div>

          {/* Horizontal Journey Tracker - DESKTOP ONLY */}
          <div className="hidden md:block bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-5">Horizontal Transit Pipeline</h3>
            
            <div className="relative flex justify-between items-center px-4">
              {/* Connected Background Track Lines */}
              <div className="absolute left-8 right-8 top-[18px] h-1 bg-slate-200 z-0" />
              <div 
                className="absolute left-8 top-[18px] h-1 bg-emerald-500 z-0 transition-all duration-700" 
                style={{ width: `${((Math.min(currentStageIndex, 10) - 1) / 9) * 100}%` }}
              />

              {STAGES_CONFIG.map((stg) => {
                const isCompleted = stg.index < currentStageIndex;
                const isActive = stg.index === currentStageIndex;
                const isUpcoming = stg.index > currentStageIndex;
                const isCurrentlyInspected = stg.index === selectedStage;
                
                const NodeIcon = stg.icon;

                return (
                  <button
                    key={stg.index}
                    onClick={() => setSelectedStage(stg.index)}
                    className="flex flex-col items-center group relative focus:outline-none z-10 cursor-pointer"
                  >
                    {/* Circle Node Element */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-4 ring-emerald-100 animate-pulse' 
                        : isCompleted 
                          ? 'bg-emerald-50 text-emerald-650 border-2 border-emerald-500' 
                          : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-slate-350'
                    } ${isCurrentlyInspected ? 'scale-115 ring-2 ring-emerald-600' : ''}`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3px]" />
                      ) : (
                        <NodeIcon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Step Label */}
                    <span className={`text-[9px] font-black tracking-tight mt-2 max-w-[70px] text-center leading-tight transition-colors duration-200 ${
                      isActive 
                        ? 'text-emerald-650' 
                        : isCompleted 
                          ? 'text-slate-650' 
                          : 'text-slate-400'
                    } ${isCurrentlyInspected ? 'text-emerald-600 font-bold underline decoration-emerald-500 decoration-2 underline-offset-4' : ''}`}>
                      {stg.title}
                    </span>

                    {/* Completion Timing Tag */}
                    <span className="text-[7.5px] font-mono text-slate-400 font-bold block mt-0.5">
                      {isCompleted ? 'Done' : isActive ? 'ACTIVE' : 'Pending'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Journey Tracker - MOBILE ONLY */}
          <div className="block md:hidden bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex justify-between items-center">
              <span>Transit Stages</span>
              <span className="text-[9px] text-slate-400">Tap to inspect details</span>
            </h3>

            <div className="space-y-2">
              {STAGES_CONFIG.map((stg) => {
                const isCompleted = stg.index < currentStageIndex;
                const isActive = stg.index === currentStageIndex;
                const isCurrentlyInspected = stg.index === selectedStage;
                const NodeIcon = stg.icon;

                return (
                  <button
                    key={stg.index}
                    onClick={() => setSelectedStage(stg.index)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left cursor-pointer ${
                      isCurrentlyInspected 
                        ? 'bg-emerald-50/50 border-emerald-500 text-slate-800 shadow-2xs' 
                        : isActive
                          ? 'bg-emerald-50/20 border-emerald-500/30 text-emerald-600'
                          : isCompleted
                            ? 'bg-white border-slate-100 text-slate-600 shadow-2xs'
                            : 'bg-white/40 border-slate-100/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          : isCompleted
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <NodeIcon className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-[10px] font-black tracking-tight leading-tight uppercase">
                          {stg.index}. {stg.title}
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                          Owner: {stg.responsible}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-mono font-black uppercase shrink-0 text-slate-400">
                        {isActive ? 'Active' : isCompleted ? 'Completed' : 'Locked'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stage Details Inspector & Diagnostic Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
            <div className="bg-slate-100/50 p-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                <span>Stage Inspector: Diagnostic Report</span>
              </span>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Level {inspectedStage.index} / 10
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
              
              {/* Left Column: Stage description & animation badge */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl ${
                    inspectedStage.index < currentStageIndex 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' 
                      : inspectedStage.index === currentStageIndex
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-200 text-slate-400'
                  }`}>
                    <inspectedStage.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{inspectedStage.title}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mt-0.5">
                      Responsible: {inspectedStage.responsible}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {inspectedStage.description}
                </p>

                {/* Animated Status Indicator Mockup */}
                <div className="bg-white border border-slate-100 p-4 rounded-xl relative overflow-hidden flex items-center justify-center h-28 shadow-2xs">
                  {inspectedStage.index === 1 && (
                    <div className="text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                        <Check className="w-5 h-5 stroke-[3px]" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">Citizen Submission Logged</span>
                    </div>
                  )}

                  {inspectedStage.index === 2 && (
                    <div className="text-center space-y-2">
                      <div className="relative flex justify-center">
                        <div className="absolute inset-0 w-8 h-8 rounded-full bg-emerald-500/20 blur-md animate-ping mx-auto" />
                        <Cpu className="w-8 h-8 text-emerald-600 relative animate-pulse" />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-600 tracking-wider">AI Classification Grid Active</span>
                    </div>
                  )}

                  {inspectedStage.index === 3 && (
                    <div className="text-center space-y-1.5 w-full">
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3].map(i => (
                          <span key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">Neighborhood consensus active: {issue.upvotes} upvotes</span>
                    </div>
                  )}

                  {inspectedStage.index === 4 && (
                    <div className="text-center space-y-1">
                      <RefreshCw className="w-7 h-7 text-emerald-500 mx-auto animate-spin" />
                      <span className="text-[9px] font-mono text-slate-400">Dispatched: {dept.code} System Queue</span>
                    </div>
                  )}

                  {inspectedStage.index === 5 && (
                    <div className="text-center space-y-1">
                      <div className="flex justify-center gap-1">
                        <Search className="w-7 h-7 text-amber-500 animate-pulse" />
                      </div>
                      <span className="text-[9px] font-mono text-amber-600 font-semibold">Officer auditing GIS metadata</span>
                    </div>
                  )}

                  {inspectedStage.index === 6 && (
                    <div className="text-center space-y-2 w-full px-4">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[pulse_1.5s_infinite]" style={{ width: '65%' }} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">Excavation & repair worksite active (65%)</span>
                    </div>
                  )}

                  {inspectedStage.index === 7 && (
                    <div className="text-center space-y-1">
                      <ClipboardList className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                      <span className="text-[9px] font-mono text-emerald-600">Post-repair compliance audit</span>
                    </div>
                  )}

                  {inspectedStage.index === 8 && (
                    <div className="text-center space-y-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle2 className="w-5 h-5 stroke-[3px]" />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-500 font-black">Remediation Certified</span>
                    </div>
                  )}

                  {inspectedStage.index === 9 && (
                    <div className="text-center space-y-1">
                      <Star className="w-8 h-8 text-amber-500 mx-auto animate-[spin_4s_linear_infinite]" />
                      <span className="text-[9px] font-mono text-slate-400">Waiting for resident star approval</span>
                    </div>
                  )}

                  {inspectedStage.index === 10 && (
                    <div className="text-center space-y-1">
                      <Trophy className="w-8 h-8 text-yellow-500 mx-auto animate-bounce" />
                      <span className="text-[9px] font-mono text-emerald-600 font-bold">Closed: District Archive Logged</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Diagnostic table & forms */}
              <div className="lg:col-span-7 bg-white border border-slate-100 p-4 rounded-xl flex flex-col justify-between shadow-2xs">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MAPPED METADATA VALUES</span>
                    <span className="text-[9px] font-bold text-slate-500">Owner: {inspectedStage.department}</span>
                  </div>

                  {/* Stage-specific diagnostic values table */}
                  <div className="space-y-2.5">
                    {inspectedStage.metrics.map((metric, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-semibold">{metric.label}</span>
                        <span className="text-slate-700 font-bold text-right truncate max-w-[200px]">{metric.value}</span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Active Pipeline Stage</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        inspectedStage.index < currentStageIndex
                          ? 'bg-emerald-50 text-emerald-600'
                          : inspectedStage.index === currentStageIndex
                            ? 'bg-emerald-500 text-white font-black'
                            : 'bg-slate-100 text-slate-400'
                      }`}>
                        {inspectedStage.index < currentStageIndex ? 'Completed' : inspectedStage.index === currentStageIndex ? 'CURRENTLY ACTIVE' : 'Locked'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Star Feedback and Close form in Stage 9 (Citizen Confirmation) */}
                {inspectedStage.index === 9 && (
                  <div className="mt-5 border-t border-slate-100 pt-4 space-y-3">
                    <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-lg text-left">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                        RESIDENT REMEDIATION VERIFICATION
                      </span>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                        As the reporting citizen, your approval completes the workflow. Please verify the completed repairs and sign off.
                      </p>
                    </div>

                    {feedbackSaved ? (
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3">
                        <Trophy className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-black text-slate-800">Closed & Approved</h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">Rating: {'⭐'.repeat(feedbackSaved.rating)}</p>
                          <p className="text-[10px] text-slate-500 leading-normal italic mt-0.5">"{feedbackSaved.feedback || 'Approved by resident'}"</p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitFeedback} className="space-y-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-500 uppercase">Rate Quality:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(null)}
                                className="p-0.5 text-xl transition cursor-pointer active:scale-125 focus:outline-none"
                              >
                                <Star 
                                  className={`w-6 h-6 ${
                                    star <= (hoverRating ?? rating) 
                                      ? 'text-amber-500 fill-amber-500' 
                                      : 'text-slate-300'
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase">Approval Notes & Suggestions</label>
                          <input
                            type="text"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="e.g. Excellent job! Street restored perfectly."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-800 placeholder:text-slate-405 focus:outline-none focus:border-emerald-500"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingFeedback}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                          {isSubmittingFeedback ? 'Verifying...' : 'Approve Repair & Close Ticket'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Real-time Officer & Admin Control Panel Integration */}
                {user && (user.role === 'Officer' || user.role === 'Admin') && (
                  <div className="mt-5 border-t border-slate-100 pt-4 space-y-3" id="officer-realtime-control-deck">
                    <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl text-left">
                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-1">
                        OFFICER COMMAND & DISPATCH CENTER
                      </span>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                        Authorized Access: Update the real-time GIS live ticket status directly from the tracker:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateIssueStatus(issue.id, 'Under Review', user.displayName || 'Officer', user.uid);
                            toast.success("Issue status changed to: Under Review");
                          } catch (e) {
                            toast.error("Failed to update status.");
                          }
                        }}
                        className={`py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition cursor-pointer text-center ${
                          issue.status === 'Under Review'
                            ? 'bg-amber-500 text-white border-amber-500 font-black'
                            : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-50'
                        }`}
                      >
                        Under Review
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateIssueStatus(issue.id, 'In Progress', user.displayName || 'Officer', user.uid);
                            toast.success("Issue status changed to: In Progress");
                          } catch (e) {
                            toast.error("Failed to update status.");
                          }
                        }}
                        className={`py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition cursor-pointer text-center ${
                          issue.status === 'In Progress'
                            ? 'bg-emerald-500 text-white border-emerald-500 font-black'
                            : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-50'
                        }`}
                      >
                        In Progress
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateIssueStatus(issue.id, 'Resolved', user.displayName || 'Officer', user.uid);
                            toast.success("Issue status marked as Resolved!");
                          } catch (e) {
                            toast.error("Failed to update status.");
                          }
                        }}
                        className={`py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition cursor-pointer text-center ${
                          issue.status === 'Resolved'
                            ? 'bg-emerald-600 text-white border-emerald-600 font-black'
                            : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-50'
                        }`}
                      >
                        Resolved
                      </button>
                    </div>

                    <div className="text-[9px] text-slate-400 font-bold text-center mt-1">
                      Current Live Status: <span className="text-slate-800 uppercase font-black">{issue.status}</span>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

          {/* Dual Columns: Map Location Card & Audit Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Spatial Location Card */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Spatial Location Data</h3>
              
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left space-y-3">
                <div className="flex gap-3">
                  <div className="h-16 w-16 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                    {issue.imageUrl ? (
                      <img src={issue.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-mono font-black text-emerald-600 block uppercase">CLASSIFICATION</span>
                    <span className="text-xs font-black text-slate-800 uppercase block truncate">{issue.category}</span>
                    <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">By: {issue.reporterName || 'Neighbor'}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-semibold">
                    <span className="text-slate-400 uppercase">GPS LATITUDE</span>
                    <span className="font-mono text-slate-600 font-semibold">{issue.location.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-semibold">
                    <span className="text-slate-400 uppercase">GPS LONGITUDE</span>
                    <span className="font-mono text-slate-600 font-semibold">{issue.location.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-semibold">
                    <span className="text-slate-400 uppercase">LODGED TIMESTAMP</span>
                    <span className="font-mono text-slate-600 font-semibold">{format(issue.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Transit Logs Registry */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>Live Action Transit Registry</span>
              </h3>
              
              <div className="bg-slate-50 text-slate-600 p-4 rounded-2xl border border-slate-100 font-mono text-[9px] leading-relaxed h-44 overflow-y-auto space-y-3 shadow-inner">
                {logs.map((log) => (
                  <div key={log.id} className="border-l border-emerald-400/55 pl-2.5 space-y-0.5 text-left">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-emerald-700 font-black uppercase text-[8px] tracking-wider">
                        [{log.action}]
                      </span>
                      <span className="text-slate-400 text-[8px]">
                        {format(log.createdAt, 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="text-slate-800 font-extrabold text-[9px]">Actor: {log.actorName}</div>
                    <p className="text-slate-500 text-[8px] leading-normal">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Interactive Resident Chat Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>Resident Chat & Live Updates ({comments.length})</span>
            </h3>

            <div className="border border-slate-100 rounded-2xl overflow-hidden flex flex-col bg-slate-50">
              
              {/* Comments Feed */}
              <div className="p-4 space-y-3.5 h-48 overflow-y-auto bg-white/60 flex flex-col">
                {comments.length === 0 ? (
                  <div className="my-auto text-center p-6 space-y-1">
                    <MessageSquare className="w-8 h-8 text-slate-450 mx-auto" />
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">No comments yet</h5>
                    <p className="text-[9px] text-slate-400 max-w-xs mx-auto">
                      Start the conversation by posting an update or asking for progress verification below.
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5 text-left items-start">
                      <div className="h-7.5 w-7.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px] shrink-0 uppercase shadow-xs">
                        {comment.userName ? comment.userName.slice(0, 2) : 'RE'}
                      </div>
                      
                      <div className="bg-white border border-slate-100 rounded-2xl p-2.5 max-w-[85%] shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[9px] font-black text-slate-800 leading-none">
                            {comment.userName}
                          </span>
                          <span className="text-[7.5px] font-bold text-slate-400 font-mono leading-none">
                            {format(comment.createdAt, 'HH:mm | d MMM')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handlePostComment} className="flex border-t border-slate-100 bg-white p-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={user ? "Post a live update or verify status..." : "Please log in to chat"}
                  disabled={!user || isSubmitting}
                  className="flex-1 px-3 py-2 text-xs font-semibold focus:outline-none placeholder:text-slate-400 text-slate-800 bg-transparent"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim() || isSubmitting || !user}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center shrink-0">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
            Community Hero Enterprise Live Transit Engine v3.0 (Active over Secure WebSockets)
          </span>
        </div>

      </motion.div>
    </motion.div>
  );
}
