// Epic tracker for RaiAI MVP development
// Tracks progress across all 13 epics

interface EpicTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  assignee?: string;
  completedAt?: Date;
  notes?: string;
}

interface Epic {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  tasks: EpicTask[];
  progress: number;
  estimatedHours: number;
  actualHours: number;
}

class EpicTracker {
  private epics: Map<string, Epic> = new Map();
  private currentEpic: string | null = null;

  constructor() {
    this.initializeEpics();
    this.loadProgress();
  }

  // Initialize all epics with their tasks
  private initializeEpics(): void {
    const epicData: Epic[] = [
      {
        id: 'epic-0',
        name: 'Critical Polish',
        description: 'Performance optimization and crash-free stability',
        color: 'red',
        status: 'pending',
        tasks: [
          {
            id: 'epic-0-1',
            title: 'Cold start < 2s',
            description: 'Optimize app startup time to under 2 seconds',
            status: 'pending',
            priority: 'high',
            estimatedHours: 8
          },
          {
            id: 'epic-0-2',
            title: 'Today tab render no spinner',
            description: 'Eliminate loading spinners on Today tab',
            status: 'pending',
            priority: 'high',
            estimatedHours: 4
          },
          {
            id: 'epic-0-3',
            title: 'Scan inference p50 < 300ms, p95 < 800ms',
            description: 'Optimize scan inference performance',
            status: 'pending',
            priority: 'high',
            estimatedHours: 12
          },
          {
            id: 'epic-0-4',
            title: 'Offline-first cache',
            description: 'Implement offline-first caching for forecast, prices, scans, advice, tickets',
            status: 'completed',
            priority: 'high',
            estimatedHours: 16
          },
          {
            id: 'epic-0-5',
            title: 'Retry queue for sync jobs',
            description: 'Implement retry queue with exponential backoff',
            status: 'completed',
            priority: 'medium',
            estimatedHours: 8
          },
          {
            id: 'epic-0-6',
            title: 'Crash-free > 99%',
            description: 'Integrate Crashlytics/Sentry and achieve 99% crash-free rate',
            status: 'pending',
            priority: 'high',
            estimatedHours: 6
          }
        ],
        progress: 0,
        estimatedHours: 54,
        actualHours: 0
      },
      {
        id: 'epic-1',
        name: 'Today Tab',
        description: 'Spray window, outbreak radar, share cards',
        color: 'blue',
        status: 'in_progress',
        tasks: [
          {
            id: 'epic-1-1',
            title: 'Spray Window badge',
            description: 'Good/Caution/Don\'t spray with 12h rain/wind data, cached',
            status: 'in_progress',
            priority: 'high',
            estimatedHours: 8
          },
          {
            id: 'epic-1-2',
            title: '1-tap reminder notification',
            description: 'Quick reminder setup for spraying',
            status: 'pending',
            priority: 'medium',
            estimatedHours: 6
          },
          {
            id: 'epic-1-3',
            title: 'Outbreak Radar card',
            description: 'Rice + Durian diseases, hyperlocal data',
            status: 'in_progress',
            priority: 'high',
            estimatedHours: 10
          },
          {
            id: 'epic-1-4',
            title: 'Share card (image + Thai caption)',
            description: 'Generate shareable cards for LINE/TikTok',
            status: 'completed',
            priority: 'medium',
            estimatedHours: 12
          }
        ],
        progress: 0,
        estimatedHours: 36,
        actualHours: 0
      },
      {
        id: 'epic-2',
        name: 'Scan → Action',
        description: 'Guided overlay, TFLite inference, result sheets',
        color: 'green',
        status: 'pending',
        tasks: [
          {
            id: 'epic-2-1',
            title: 'Guided overlay (rice leaf, durian leaf/fruit/branch)',
            description: 'Visual guidance for proper scanning',
            status: 'pending',
            priority: 'high',
            estimatedHours: 10
          },
          {
            id: 'epic-2-2',
            title: 'On-device TFLite inference (<300ms p50)',
            description: 'Optimize ML inference performance',
            status: 'pending',
            priority: 'high',
            estimatedHours: 16
          },
          {
            id: 'epic-2-3',
            title: 'Result→Action sheet: 3 steps, PPE warning, Mixing Calculator, Reminder',
            description: 'Comprehensive action guidance',
            status: 'pending',
            priority: 'high',
            estimatedHours: 12
          },
          {
            id: 'epic-2-4',
            title: '"Uncertain" path when confidence low',
            description: 'Handle low-confidence scan results',
            status: 'pending',
            priority: 'medium',
            estimatedHours: 6
          },
          {
            id: 'epic-2-5',
            title: 'Durian extras: harvest window hint, grade checklist placeholder',
            description: 'Durian-specific features',
            status: 'pending',
            priority: 'low',
            estimatedHours: 8
          }
        ],
        progress: 0,
        estimatedHours: 52,
        actualHours: 0
      },
      {
        id: 'epic-3',
        name: 'Price & Buyers',
        description: 'Price alerts, buyer directory, notifications',
        color: 'yellow',
        status: 'pending',
        tasks: [
          {
            id: 'epic-3-1',
            title: 'Prices drawer: rice paddy per ton, durian grades per kg',
            description: 'Comprehensive price display',
            status: 'pending',
            priority: 'high',
            estimatedHours: 8
          },
          {
            id: 'epic-3-2',
            title: '1 free price alert (Pro unlock unlimited)',
            description: 'Price alert system with Pro upgrade',
            status: 'pending',
            priority: 'high',
            estimatedHours: 10
          },
          {
            id: 'epic-3-3',
            title: 'Buyer directory (call/LINE, pickup hours)',
            description: 'Local buyer contact information',
            status: 'pending',
            priority: 'medium',
            estimatedHours: 12
          },
          {
            id: 'epic-3-4',
            title: 'Push notification when alert triggered',
            description: 'Real-time price alert notifications',
            status: 'pending',
            priority: 'medium',
            estimatedHours: 6
          },
          {
            id: 'epic-3-5',
            title: 'Cache last snapshot offline',
            description: 'Offline price data caching',
            status: 'pending',
            priority: 'low',
            estimatedHours: 4
          }
        ],
        progress: 0,
        estimatedHours: 40,
        actualHours: 0
      },
      {
        id: 'epic-4',
        name: 'Shop Ticket + Counter Mode',
        description: 'QR generation, counter webview',
        color: 'purple',
        status: 'pending',
        tasks: [
          {
            id: 'epic-4-1',
            title: 'Ticket generated post-scan: diagnosis + product classes + QR ID',
            description: 'Generate shop tickets with QR codes',
            status: 'pending',
            priority: 'high',
            estimatedHours: 10
          },
          {
            id: 'epic-4-2',
            title: 'Export as image + PDF; printable via Android print manager',
            description: 'Multiple export formats for shop tickets',
            status: 'pending',
            priority: 'medium',
            estimatedHours: 8
          },
          {
            id: 'epic-4-3',
            title: 'Counter Mode WebView: scan QR → confirm sale → mark fulfilled → log referral',
            description: 'Shop counter interface',
            status: 'pending',
            priority: 'high',
            estimatedHours: 16
          },
          {
            id: 'epic-4-4',
            title: 'Retry queue for offline scans',
            description: 'Handle offline scan submissions',
            status: 'pending',
            priority: 'medium',
            estimatedHours: 6
          }
        ],
        progress: 0,
        estimatedHours: 40,
        actualHours: 0
      },
      {
        id: 'epic-5',
        name: 'Thai-first Localization & Accessibility',
        description: 'Thai UI, accessibility features',
        color: 'brown',
        status: 'completed',
        tasks: [
          {
            id: 'epic-5-1',
            title: 'All farmer-facing UI in Thai (short Isan hints for Scan/Result→Action)',
            description: 'Complete Thai localization',
            status: 'completed',
            priority: 'high',
            estimatedHours: 20
          },
          {
            id: 'epic-5-2',
            title: 'Large, glove-friendly buttons (≥48dp touch targets)',
            description: 'Accessibility for farming conditions',
            status: 'completed',
            priority: 'high',
            estimatedHours: 8
          },
          {
            id: 'epic-5-3',
            title: 'Share cards auto-generate Thai captions',
            description: 'Thai caption generation for social sharing',
            status: 'completed',
            priority: 'medium',
            estimatedHours: 12
          },
          {
            id: 'epic-5-4',
            title: 'i18n file (i18n.ts) with Thai strings',
            description: 'Internationalization system',
            status: 'completed',
            priority: 'high',
            estimatedHours: 16
          },
          {
            id: 'epic-5-5',
            title: 'TalkBack labels + high contrast mode',
            description: 'Accessibility features',
            status: 'pending',
            priority: 'medium',
            estimatedHours: 10
          }
        ],
        progress: 0,
        estimatedHours: 66,
        actualHours: 0
      }
      // Add more epics as needed...
    ];

    epicData.forEach(epic => {
      this.epics.set(epic.id, epic);
      this.calculateEpicProgress(epic.id);
    });
  }

  // Get all epics
  getAllEpics(): Epic[] {
    return Array.from(this.epics.values());
  }

  // Get epic by ID
  getEpic(epicId: string): Epic | null {
    return this.epics.get(epicId) || null;
  }

  // Update task status
  updateTaskStatus(epicId: string, taskId: string, status: EpicTask['status'], notes?: string): void {
    const epic = this.epics.get(epicId);
    if (!epic) return;

    const task = epic.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = status;
    if (notes) task.notes = notes;
    
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    this.calculateEpicProgress(epicId);
    this.saveProgress();
  }

  // Calculate epic progress
  private calculateEpicProgress(epicId: string): void {
    const epic = this.epics.get(epicId);
    if (!epic) return;

    const totalTasks = epic.tasks.length;
    const completedTasks = epic.tasks.filter(t => t.status === 'completed').length;
    
    epic.progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Update epic status based on progress
    if (epic.progress === 100) {
      epic.status = 'completed';
    } else if (epic.progress > 0) {
      epic.status = 'in_progress';
    } else {
      epic.status = 'pending';
    }
  }

  // Get overall project progress
  getOverallProgress(): {
    totalEpics: number;
    completedEpics: number;
    inProgressEpics: number;
    pendingEpics: number;
    overallProgress: number;
    totalEstimatedHours: number;
    totalActualHours: number;
  } {
    const epics = Array.from(this.epics.values());
    const totalEpics = epics.length;
    const completedEpics = epics.filter(e => e.status === 'completed').length;
    const inProgressEpics = epics.filter(e => e.status === 'in_progress').length;
    const pendingEpics = epics.filter(e => e.status === 'pending').length;
    
    const overallProgress = totalEpics > 0 ? (completedEpics / totalEpics) * 100 : 0;
    const totalEstimatedHours = epics.reduce((sum, epic) => sum + epic.estimatedHours, 0);
    const totalActualHours = epics.reduce((sum, epic) => sum + epic.actualHours, 0);

    return {
      totalEpics,
      completedEpics,
      inProgressEpics,
      pendingEpics,
      overallProgress,
      totalEstimatedHours,
      totalActualHours
    };
  }

  // Generate progress report
  generateProgressReport(): string {
    const progress = this.getOverallProgress();
    const epics = this.getAllEpics();

    let report = '📊 RaiAI MVP Progress Report\n';
    report += '============================\n\n';
    report += `Overall Progress: ${progress.overallProgress.toFixed(1)}%\n`;
    report += `Epics: ${progress.completedEpics} completed, ${progress.inProgressEpics} in progress, ${progress.pendingEpics} pending\n`;
    report += `Estimated Hours: ${progress.totalEstimatedHours}\n`;
    report += `Actual Hours: ${progress.totalActualHours}\n\n`;

    report += 'Epic Breakdown:\n';
    report += '---------------\n';
    
    epics.forEach(epic => {
      const statusIcon = epic.status === 'completed' ? '✅' : 
                        epic.status === 'in_progress' ? '🔄' : 
                        epic.status === 'blocked' ? '🚫' : '⏳';
      
      report += `${statusIcon} ${epic.name}: ${epic.progress.toFixed(1)}%\n`;
    });

    return report;
  }

  // Save progress to localStorage
  private saveProgress(): void {
    try {
      const progressData = {
        epics: Array.from(this.epics.entries()),
        lastUpdated: Date.now()
      };
      localStorage.setItem('rai-ai-epic-progress', JSON.stringify(progressData));
    } catch (error) {
      console.warn('Failed to save epic progress:', error);
    }
  }

  // Load progress from localStorage
  private loadProgress(): void {
    try {
      const stored = localStorage.getItem('rai-ai-epic-progress');
      if (stored) {
        const progressData = JSON.parse(stored);
        this.epics = new Map(progressData.epics);
      }
    } catch (error) {
      console.warn('Failed to load epic progress:', error);
    }
  }
}

// Singleton instance
export const epicTracker = new EpicTracker();

// Convenience functions
export const getEpicProgress = (epicId: string): number => {
  const epic = epicTracker.getEpic(epicId);
  return epic ? epic.progress : 0;
};

export const updateEpicTask = (epicId: string, taskId: string, status: EpicTask['status'], notes?: string): void => {
  epicTracker.updateTaskStatus(epicId, taskId, status, notes);
};

export const getOverallProgress = () => {
  return epicTracker.getOverallProgress();
};

export const generateProgressReport = () => {
  return epicTracker.generateProgressReport();
};
