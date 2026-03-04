export interface TimeSpentOvertime {
    [date: string]: number;
}

export interface UserPerLearnerInfo {
    username: string;
    name: string;
    email: string;
    date_joined: string;
    last_activity: string;
    total_assessments: number;
    total_time_spent: number;
    total_videos: number;
    course_completions: number;
    time_spent_overtime: TimeSpentOvertime;
}

export interface UserPerLearnerResponse {
    data: UserPerLearnerInfo;
}

export interface UserActivityInfo {
    course_id: string;
    name: string;
    course_start: string;
    course_end: string;
    average_time_invested: number;
    time_invested: number;
    days_away: string;
    last_access_date: string;
    days_accessed: number;
}

export interface UserActivityResponse {
    data: UserActivityInfo[];
    total: number;
}

export interface TimeSpent {
    date: string;
    minutes: number;
}
