# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D/VR Film Supplier Management System for managing technical suppliers who create 3D/VR content using UE5/U3D. The system supports supplier档案 management, project tracking, 6-dimension quality evaluation, **capacity saturation assessment**, and annual performance reporting.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC
- **UI**: shadcn/ui + Tailwind CSS
- **Forms**: react-hook-form + Zod
- **Charts**: Recharts
- **Excel Export**: xlsx

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Run migrations
npx prisma migrate dev --name <migration_name>

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset
```

### shadcn/ui
```bash
# Add new component
npx shadcn-ui@latest add <component-name>

# Example: npx shadcn-ui@latest add button table dialog
```

## Architecture

### Directory Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── suppliers/            # Supplier management
│   │   ├── projects/             # Project management
│   │   ├── capacity/             # Capacity dashboard (NEW)
│   │   ├── evaluations/          # Quality evaluation
│   │   └── reports/              # Reports & analytics
│   └── api/trpc/[trpc]/route.ts  # tRPC API route
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── capacity/                 # Capacity components (NEW)
│   └── charts/                   # Chart components
├── server/
│   └── trpc/
│       ├── routers/              # tRPC routers
│       │   ├── supplier.ts
│       │   ├── project.ts
│       │   ├── capacity.ts       # Capacity API (NEW)
│       │   ├── evaluation.ts
│       │   └── report.ts
│       └── router.ts             # Root router
└── lib/                          # Utilities
```

### Database Schema Overview

**Core Entities:**
- `suppliers` - Supplier base info with level (S/A/B/C)
- `team_members` - Team structure (UE5/U3D engineers, artists, animators, etc.)
- `supplier_capacity` - Capacity config: totalMembers, capacityFactor, monthlyCapacity (NEW)
- `projects` - Project info (budget, actual cost, timeline, status)
- `supplier_projects` - Many-to-many with capacity fields: estimatedManDays, complexityLevel, currentStage, workloadShare, currentLoad (UPDATED)
- `quality_reviews` - 6-dimension quality scores (1-5 scale with weighted total)
- `supplier_ratings` - Aggregated annual/quarterly statistics

**Quality Evaluation Weights:**
- Visual Quality: 25%
- Animation Smoothness: 20%
- VFX Match: 15%
- Audio Quality: 15%
- Camera Work: 15%
- Story Novelty: 10%

### Capacity Saturation Assessment (NEW)

**Saturation Formula:**
```typescript
// Monthly standard capacity
monthlyCapacity = totalMembers × capacityFactor

// Project monthly load
projectLoad = (estimatedManDays / 22 / durationMonths) × workloadShare

// Weighted load with complexity and stage
weightedLoad = projectLoad × complexityFactor × stageFactor

// Parallel efficiency loss
parallelFactor = 1 proj(1.0) / 2 projs(1.15) / 3 projs(1.35) / 4+ projs(1.6)

// Total saturation
saturationRate = (Σ(weightedLoad) × parallelFactor) / monthlyCapacity × 100%
```

**Reference Tables:**

Complexity Factor:
| Level | Factor | Description |
|-------|--------|-------------|
| simple | 0.8 | Standard scenes, regular workflow |
| medium | 1.0 | Normal difficulty |
| complex | 1.3 | Large scenes, multiple characters |
| extreme | 1.6 | Open world, heavy VFX, innovative tech |

Stage Factor:
| Stage | Factor | Description |
|-------|--------|-------------|
| planning | 0.2 | Initial communication/quotation |
| pre_production | 0.5 | Concept design phase |
| production | 1.0 | Core production (full load) |
| review | 0.8 | Revision/feedback period |
| delivery | 0.6 | Final delivery phase |
| paused | 0.1 | On hold/waiting for feedback |

Capacity Factor by Team Size:
| Size | Factor | Note |
|------|--------|------|
| < 10 | 0.7 | Small team, flexible but fragile |
| 10-20 | 0.8 | Standard capacity |
| 20-50 | 0.75 | Management overhead |
| > 50 | 0.7 | Large team coordination cost |

Saturation Status:
| Range | Status | Color | Action |
|-------|--------|-------|--------|
| 0-60% | available | 🟢 green | Can accept new projects |
| 60-80% | caution | 🟡 yellow | Evaluate carefully |
| 80-100% | saturated | 🔴 red | Avoid new projects |
| > 100% | overload | ⚫ dark | Reduce workload |

### Key Implementation Details

**Scoring Calculation:**
```typescript
// Total score is weighted average of 6 dimensions (1-5 scale)
totalScore = visualQuality*0.25 + animationSmoothness*0.20 + 
             vfxMatch*0.15 + audioQuality*0.15 + cameraWork*0.15 + storyNovelty*0.10

// Cost performance = avg quality / (cost in ten-thousands)
costPerformance = avgQualityScore / (totalCost / 10000)
```

**Evaluation Workflow:**
Project Completed → Pending Evaluation → Evaluating → Evaluated

**Capacity Update Workflow:**
Project Status/Stage Changed → Recalculate Saturation → Update UI

**Supplier Levels:**
- S: Strategic partner, priority allocation
- A: High quality, regular collaboration
- B: Backup/observation
- C: Phasing out

## Important Files

| File | Purpose |
|------|---------|
| `/ui_design.pen` | Pencil UI design file (9 pages + components) |
| `/design-exports/*.png` | Exported UI mockups for reference |
| `/prisma/schema.prisma` | Database schema definition |
| `/src/server/trpc/routers/evaluation.ts` | Quality evaluation API with scoring logic |
| `/src/server/trpc/routers/capacity.ts` | Capacity assessment API with saturation calculation (NEW) |
| `/src/components/forms/evaluation-form.tsx` | 6-dimension evaluation form UI |
| `/src/components/capacity/saturation-badge.tsx` | Saturation status badge component (NEW) |
| `/src/components/capacity/new-project-assessment.tsx` | New project capacity impact assessment (NEW) |
| `/src/server/trpc/routers/report.ts` | Report generation API |
| `/src/app/(dashboard)/projects/[id]/page.tsx` | Project detail with tabs for deliveries/evaluation |
| `/src/app/(dashboard)/capacity/page.tsx` | Capacity dashboard page (NEW) |

## Development Notes

- Use Zod for all form validation and API input validation
- tRPC provides end-to-end type safety between client and server
- Prisma migrations should be created for any schema changes
- shadcn/ui components are customizable - modify in `/components/ui/`
- Evaluation forms must calculate weighted total in real-time
- Capacity calculations should update when project stage changes
- Reports should support Excel export using `xlsx` library
- Saturation badges should use color coding: green < 60%, yellow 60-80%, red 80-100%, dark > 100%

## Deployment Requirements

### Network Configuration
- **Deployment Type**: Local Area Network (LAN) deployment
- **Access Method**: Access via IP address (e.g., `http://192.168.x.x:23456`)
- **Port**: Fixed port `23456`
- **Network**: Internal LAN only, no public internet exposure required

### Production Deployment Steps
```bash
# 1. Build the application
npm run build

# 2. Start production server on port 23456 with host binding
# Option A: Using Next.js directly (not recommended for production)
PORT=23456 npm start -- -H 0.0.0.0

# Option B: Using PM2 (recommended)
pm install -g pm2
pm2 start npm --name "vr-supplier-mgmt" -- start -- -p 23456 -H 0.0.0.0

# Option C: Using Node.js directly
node .next/standalone/server.js -p 23456 -H 0.0.0.0
```

### Environment Configuration
```env
# .env.production
NODE_ENV=production
PORT=23456
HOST=0.0.0.0
DATABASE_URL="postgresql://user:password@localhost:5432/vr_supplier_mgmt"
NEXTAUTH_URL="http://your-lan-ip:23456"
NEXTAUTH_SECRET="your-secret-key"
```

### Firewall Configuration
Ensure port 23456 is open on the deployment server:
```bash
# Linux (iptables)
sudo iptables -A INPUT -p tcp --dport 23456 -j ACCEPT

# Linux (firewalld)
sudo firewall-cmd --permanent --add-port=23456/tcp
sudo firewall-cmd --reload

# Windows
# Add inbound rule in Windows Defender Firewall for port 23456
```

### Testing LAN Access
After deployment, verify access from another machine on the same network:
```bash
# From client machine
curl http://<server-ip>:23456
```

## Development Workflow (STRICT)

This workflow MUST be followed for every development task:

### Step 1: Read Plan
- Read `/plan.md` to understand the feature requirements and scope
- Check current project status and any relevant error logs

### Step 2: Create Development Plan
- Create a detailed development plan with:
  - Files to be created/modified
  - Implementation approach
  - Testing strategy
- **OUTPUT**: Present the plan to user for confirmation
- **WAIT**: Do NOT proceed until user explicitly confirms

### Step 3: Development
- Implement the feature according to the confirmed plan
- Follow code style and architecture conventions
- Add necessary comments for complex logic

### Step 4: Testing
- Perform complete testing including:
  - Unit tests (if applicable)
  - Integration tests
  - Manual end-to-end testing
  - Edge case verification
- **VERIFY**: All tests must pass before proceeding

### Step 5: User Notification
- **OUTPUT**: Notify user that development and testing are complete
- Summarize what was implemented
- Provide testing results
- Await user acceptance

### Step 6: Error Documentation
- If any errors were encountered during development:
  - Document in `/ERRORS.md` following the error template
  - Include error description, cause, solution, and prevention
- Review and update error log for future reference

### Workflow Checklist
Before starting any task, confirm:
- [ ] Plan has been read and understood
- [ ] Development plan has been presented to user
- [ ] User has explicitly confirmed to proceed

After completing development:
- [ ] Complete testing has been performed
- [ ] User has been notified of completion
- [ ] Errors encountered have been documented in `/ERRORS.md`

## Error Tracking

Record recurring errors in `/ERRORS.md` with:
- Error description and stack trace
- Root cause analysis
- Solution steps
- Prevention measures

Review the error log before starting new features to avoid known pitfalls.

**CRITICAL**: Always follow the Development Workflow above. Never skip user confirmation before development.
