/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  subject: string;
  completed: boolean;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface StudySession {
  id: string;
  taskId?: string;
  startTime: string;
  duration: number; // in seconds
  intensity: number; // 1-10
  focusScore: number; // 0-100
}

export interface ProductivityStats {
  totalStudyTime: number;
  averageFocus: number;
  burnoutRisk: number; // 0-100
  focusTrend: 'up' | 'down' | 'stable';
}
export interface UserProfile {
  name: string;
  email: string;
  avatarSeed: string;
  avatarUrl?: string;
  membershipStatus: 'Pro Member' | 'Free Member';
}
