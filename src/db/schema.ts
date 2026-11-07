import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------------------------------- auth --------------------------------- */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

/* -------------------------------- profile -------------------------------- */

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull().default(""),
  location: text("location").notNull().default("karbala, iraq"),
  specialization: text("specialization").notNull().default("food & hospitality visual content"),
  ambition: text("ambition").notNull().default("build a creative production studio"),
  equipment: jsonb("equipment").$type<string[]>().notNull().default([]),
  photoExperience: text("photo_experience").notNull().default("beginner"),
  videoSkills: text("video_skills").notNull().default("beginner"),
  portfolioLinks: jsonb("portfolio_links").$type<string[]>().notNull().default([]),
  instagram: text("instagram").notNull().default(""),
  currentServices: jsonb("current_services").$type<string[]>().notNull().default([]),
  weeklyHours: integer("weekly_hours").notNull().default(20),
  currentRevenue: numeric("current_revenue").notNull().default("0"),
  existingClients: integer("existing_clients").notNull().default(0),
  monthlyExpenses: numeric("monthly_expenses").notNull().default("0"),
  financialTarget: numeric("financial_target").notNull().default("2000"),
  preferredCategories: jsonb("preferred_categories").$type<string[]>().notNull().default([]),
  currency: text("currency").notNull().default("USD"),
  exchangeRate: numeric("exchange_rate").notNull().default("1310"),
  notifPrefs: jsonb("notif_prefs").$type<Record<string, boolean>>().notNull().default({}),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("الوصول إلى $2,000 إيراد محصّل"),
    target: numeric("target").notNull().default("2000"),
    currency: text("currency").notNull().default("USD"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("goals_user_idx").on(t.userId)]
);

/* -------------------------------- roadmap -------------------------------- */

export const roadmapPhases = pgTable(
  "roadmap_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    key: text("key").notNull(),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull(),
    objectiveAr: text("objective_ar").notNull(),
    unlockRule: text("unlock_rule").notNull().default(""),
    status: text("status").notNull().default("locked"), // locked | active | completed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("phases_user_idx_unique").on(t.userId, t.idx)]
);

export const roadmapTasks = pgTable(
  "roadmap_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phaseId: uuid("phase_id")
      .notNull()
      .references(() => roadmapPhases.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    titleAr: text("title_ar").notNull(),
    descAr: text("desc_ar").notNull().default(""),
    evidenceHint: text("evidence_hint").notNull().default(""),
    status: text("status").notNull().default("pending"), // pending | in_progress | done
    evidence: text("evidence").notNull().default(""),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("rtasks_phase_idx").on(t.phaseId), index("rtasks_user_idx").on(t.userId)]
);

/* ----------------------------- missions & tasks --------------------------- */

export const dailyMissions = pgTable(
  "daily_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    title: text("title").notNull(),
    focus: text("focus").notNull().default(""),
    measurableResult: text("measurable_result").notNull().default(""),
    status: text("status").notNull().default("active"), // active | completed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("missions_user_date_unique").on(t.userId, t.date)]
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id").references(() => dailyMissions.id, { onDelete: "cascade" }),
    roadmapTaskId: uuid("roadmap_task_id").references(() => roadmapTasks.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    why: text("why").notNull().default(""),
    steps: jsonb("steps").$type<string[]>().notNull().default([]),
    estMinutes: integer("est_minutes").notNull().default(30),
    tools: text("tools").notNull().default(""),
    deliverable: text("deliverable").notNull().default(""),
    completionCriteria: text("completion_criteria").notNull().default(""),
    kind: text("kind").notNull().default("supporting"), // primary | supporting
    status: text("status").notNull().default("pending"), // pending | in_progress | paused | done
    notes: text("notes").notNull().default(""),
    resultNote: text("result_note").notNull().default(""),
    dueDate: text("due_date").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("tasks_user_idx").on(t.userId), index("tasks_mission_idx").on(t.missionId)]
);

/* ----------------------------------- CRM ---------------------------------- */

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("restaurant"),
    location: text("location").notNull().default("karbala"),
    address: text("address").notNull().default(""),
    website: text("website").notNull().default(""),
    instagram: text("instagram").notNull().default(""),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    decisionMaker: text("decision_maker").notNull().default(""),
    contactPermission: text("contact_permission").notNull().default("unknown"), // unknown | granted | denied
    leadScore: integer("lead_score").notNull().default(0),
    analysisSummary: text("analysis_summary").notNull().default(""),
    visualOpportunity: text("visual_opportunity").notNull().default(""),
    recommendedService: text("recommended_service").notNull().default(""),
    stage: text("stage").notNull().default("discovered"),
    estimatedDealValue: numeric("estimated_deal_value").notNull().default("0"),
    nextAction: text("next_action").notNull().default(""),
    nextActionDate: text("next_action_date").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("biz_user_idx").on(t.userId),
    index("biz_stage_idx").on(t.userId, t.stage),
    index("biz_score_idx").on(t.userId, t.leadScore),
  ]
);

export const businessAnalyses = pgTable(
  "business_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    input: text("input").notNull().default(""),
    summary: text("summary").notNull().default(""),
    evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
    hypotheses: jsonb("hypotheses").$type<string[]>().notNull().default([]),
    opportunities: jsonb("opportunities").$type<string[]>().notNull().default([]),
    concept: text("concept").notNull().default(""),
    recommendedService: text("recommended_service").notNull().default(""),
    outreachDraft: text("outreach_draft").notNull().default(""),
    confidence: integer("confidence").notNull().default(50),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("analyses_biz_idx").on(t.businessId)]
);

export const outreachMessages = pgTable(
  "outreach_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("instagram"), // instagram | whatsapp | email
    tone: text("tone").notNull().default("professional"),
    language: text("language").notNull().default("ar"),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("draft"), // draft | sent | delivered | replied | interested | rejected | suppressed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [index("outreach_biz_idx").on(t.businessId), index("outreach_user_idx").on(t.userId)]
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("instagram"),
    status: text("status").notNull().default("active"), // active | stalled | closed
    messages: jsonb("messages")
      .$type<{ dir: "in" | "out"; body: string; at: string }[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("conv_biz_idx").on(t.businessId)]
);

/* ----------------------------- services & deals --------------------------- */

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("ad_video"),
    description: text("description").notNull().default(""),
    deliverables: jsonb("deliverables").$type<string[]>().notNull().default([]),
    videosCount: integer("videos_count").notNull().default(0),
    photosCount: integer("photos_count").notNull().default(0),
    productionHours: numeric("production_hours").notNull().default("0"),
    editingHours: numeric("editing_hours").notNull().default("0"),
    revisions: integer("revisions").notNull().default(2),
    price: numeric("price").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    estimatedCost: numeric("estimated_cost").notNull().default("0"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("services_user_idx").on(t.userId)]
);

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    title: text("title").notNull().default(""),
    overview: text("overview").notNull().default(""),
    concept: text("concept").notNull().default(""),
    deliverables: jsonb("deliverables").$type<string[]>().notNull().default([]),
    timeline: text("timeline").notNull().default(""),
    price: numeric("price").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    paymentTerms: text("payment_terms").notNull().default("50% عند بدء المشروع، و50% عند التسليم."),
    revisionPolicy: text("revision_policy").notNull().default("جولتا مراجعة مجانيتان ضمن النطاق المتفق عليه."),
    status: text("status").notNull().default("draft"), // draft | sent | accepted | rejected | expired
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [index("proposals_user_idx").on(t.userId)]
);

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    title: text("title").notNull().default(""),
    stage: text("stage").notNull().default("quoted"), // quoted | negotiating | contracted | invoiced | won | lost
    value: numeric("value").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    usdValue: numeric("usd_value").notNull().default("0"),
    deliveryStatus: text("delivery_status").notNull().default("not_started"), // not_started | in_production | delivered
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("deals_user_idx").on(t.userId), index("deals_stage_idx").on(t.userId, t.stage)]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    amount: numeric("amount").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    usdAmount: numeric("usd_amount").notNull().default("0"),
    method: text("method").notNull().default("cash"),
    note: text("note").notNull().default(""),
    receivedAt: text("received_at").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("payments_user_idx").on(t.userId), index("payments_deal_idx").on(t.dealId)]
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    amount: numeric("amount").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    usdAmount: numeric("usd_amount").notNull().default("0"),
    category: text("category").notNull().default("other"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("expenses_user_idx").on(t.userId)]
);

/* ------------------------------ content studio ---------------------------- */

export const scripts = pgTable(
  "scripts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    type: text("type").notNull().default("reel"),
    mode: text("mode").notNull().default("confident"),
    language: text("language").notNull().default("ar"),
    topic: text("topic").notNull().default(""),
    hook: text("hook").notNull().default(""),
    story: text("story").notNull().default(""),
    conflict: text("conflict").notNull().default(""),
    insight: text("insight").notNull().default(""),
    visualDirection: text("visual_direction").notNull().default(""),
    shotList: jsonb("shot_list").$type<string[]>().notNull().default([]),
    voiceover: text("voiceover").notNull().default(""),
    ending: text("ending").notNull().default(""),
    caption: text("caption").notNull().default(""),
    cta: text("cta").notNull().default(""),
    commercial: jsonb("commercial")
      .$type<{
        cameraMovement?: string;
        lighting?: string;
        soundDesign?: string;
        editingNotes?: string;
        adMessage?: string;
      }>()
      .notNull()
      .default({}),
    status: text("status").notNull().default("draft"), // draft | saved | published
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("scripts_user_idx").on(t.userId)]
);

export const contentProjects = pgTable(
  "content_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    scriptId: uuid("script_id").references(() => scripts.id, { onDelete: "set null" }),
    platform: text("platform").notNull().default("instagram"),
    status: text("status").notNull().default("idea"), // idea | in_production | published
    url: text("url").notNull().default(""),
    publishedAt: text("published_at").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("content_user_idx").on(t.userId)]
);

/* --------------------------- notifications & AI --------------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notif_user_idx").on(t.userId, t.read)]
);

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("ai_conv_user_idx").on(t.userId)]
);

export const aiMemory = pgTable(
  "ai_memory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("ai_memory_user_key").on(t.userId, t.key)]
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("info"),
    summary: text("summary").notNull(),
    meta: jsonb("meta").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_user_idx").on(t.userId)]
);

/* --------------------------------- types ---------------------------------- */

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type RoadmapPhase = typeof roadmapPhases.$inferSelect;
export type RoadmapTask = typeof roadmapTasks.$inferSelect;
export type DailyMission = typeof dailyMissions.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type BusinessAnalysis = typeof businessAnalyses.$inferSelect;
export type OutreachMessage = typeof outreachMessages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Script = typeof scripts.$inferSelect;
export type ContentProject = typeof contentProjects.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AiMessage = typeof aiConversations.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
