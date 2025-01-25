/**
 * Core type definitions for the NIRF Recommendation System
 * This file serves as the central location for all shared interfaces and types
 */

/**
 * Represents the geographical location of an institution
 */
export interface Location {
    city: string;
    state: string;
}

/**
 * Represents the five main NIRF assessment parameters
 * Each score is normalized to a 0-100 scale
 */
export interface Parameters {
    tlr_score: number;      // Teaching Learning & Resources
    rpc_score: number;      // Research, Professional Practice & Collaborative Performance
    go_score: number;       // Graduation Outcomes
    oi_score: number;       // Outreach and Inclusivity
    perception_score: number; // Peer Perception
}

/**
 * Defines the detailed structure of TLR (Teaching Learning & Resources) metrics
 */
export interface TLRMetrics {
    student_strength: {
        total_students: number;    // Total student count
        enrolled_students: number; // Currently enrolled students
        doctoral_students: number; // PhD students
    };
    faculty_ratio: number;         // Student-to-faculty ratio
    faculty_qualification: {
        phd_percentage: number;    // Percentage of faculty with PhD
        experience_dist: {         // Faculty experience distribution
            upto_8yrs: number;     // 0-8 years experience
            upto_15yrs: number;    // 8-15 years experience
            above_15yrs: number;   // 15+ years experience
        };
    };
    financial_resources: {
        capital_expenditure: number;    // Infrastructure spending
        operational_expenditure: number; // Running costs
    };
}

/**
 * Defines the detailed structure of Research & Professional Practice metrics
 */
export interface RPCMetrics {
    publications: {
        count: number;           // Total publication count
        citation_count: number;  // Total citations
        quality_publications: number; // High-impact publications
    };
    patents: {
        filed: number;          // Patents filed
        granted: number;        // Patents granted
        licensed: number;       // Patents licensed
    };
    funding: {
        research_grants: number;    // Research funding received
        consultancy: number;        // Consultancy earnings
    };
}

/**
 * Represents a point in time for historical data
 */
export interface HistoricalDataPoint {
    year: number;
    ranking: number;
    parameters: Parameters;
}

/**
 * Base institution interface with required properties
 */
export interface BaseInstitution {
    institute_id: string;           // Unique identifier for the institution
    name: string;                   // Full name of the institution
    current_ranking: number;        // Current NIRF ranking
    parameters: Parameters;         // Main NIRF parameters
    location: Location;             // Geographic location
}

/**
 * Extended institution interface with optional detailed metrics
 */
export interface Institution extends BaseInstitution {
    detailed_metrics?: {            // Optional detailed metrics
        tlr: TLRMetrics;           // Teaching Learning & Resources details
        rpc: RPCMetrics;           // Research & Professional Practice details
    };
    historical_data?: HistoricalDataPoint[];  // Optional historical performance data
}

/**
 * Dashboard-specific institution data
 */
export interface InstitutionDashboardData extends BaseInstitution {
    trend_data?: {
        parameter: keyof Parameters;
        current_value: number;
        previous_value: number;
        change_percentage: number;
    }[];
    benchmark_comparison?: {
        parameter: keyof Parameters;
        institution_score: number;
        benchmark_score: number;
        difference: number;
    }[];
}

/**
 * Defines the structure for improvement recommendations
 */
export interface Recommendation {
    parameter: keyof Parameters;    // Which parameter this recommendation targets
    currentScore: number;          // Current score in this parameter
    targetScore: number;           // Target score to achieve
    priority: 'High' | 'Medium' | 'Low'; // Priority level for this improvement
    actions: string[];             // List of recommended actions
    impact: string;                // Expected impact of implementation
    timeframe: string;             // Estimated time for implementation
    resources_needed?: string[];   // Optional list of required resources
}

/**
 * Filter state for analytics and reporting
 */
export interface FilterState {
    search: string;                // Search term for filtering institutions
    state: string;                 // Filter by state
    rankRange: [number, number];   // Range of rankings to include
    parameterFocus: keyof Parameters | 'all'; // Which parameter to focus on
}

/**
 * Represents comparison data between institutions
 */
export interface ComparisonData {
    parameter: string;
    [institutionName: string]: string | number; // Dynamic keys for institution scores
}

/**
 * Analytics period options for data analysis
 */
export type AnalyticsPeriod = 'yearly' | 'quarterly' | 'monthly';

/**
 * Chart type options for visualization
 */
export type ChartType = 'bar' | 'line' | 'radar' | 'pie';

/**
 * Report generation options
 */
export interface ReportOptions {
    includeCharts: boolean;
    periodicity: AnalyticsPeriod;
    chartTypes: ChartType[];
    parameters: (keyof Parameters)[];
    compareWithBenchmark: boolean;
}

/**
 * Utility type for transforming institution data
 */
export type InstitutionTransformer = (institution: Institution) => InstitutionDashboardData;

/**
 * Dashboard metrics calculation result
 */
export interface DashboardMetrics {
    overall_score: number;
    ranking_change: number;
    parameter_scores: Record<keyof Parameters, number>;
    improvements_needed: Array<{
        parameter: keyof Parameters;
        current: number;
        target: number;
        gap: number;
    }>;
}