import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, CreateTrialLicenseKeyRequestBody, ErrorCode, isNil, LicenseKeyEntity, PlanName, TeamProjectsLimit, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { telemetry } from '../../helper/telemetry.utils'
import { platformService } from '../../platform/platform.service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'

const secretManagerLicenseKeysRoute = 'https://secrets.activepieces.com/license-keys'

const handleUnexpectedSecretsManagerError = (log: FastifyBaseLogger, message: string) => {
    log.error(`[ERROR]: Unexpected error from secret manager: ${message}`)
    throw new Error(message)
}

// Premium enterprise license that never expires - all features enabled
const LIFETIME_ENTERPRISE_LICENSE: LicenseKeyEntity = {
    id: 'lifetime-enterprise',
    email: 'enterprise@localhost',
    expiresAt: '2099-12-31T23:59:59.999Z',
    activatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    key: 'lifetime-enterprise-key',
    ssoEnabled: true,
    environmentsEnabled: true,
    showPoweredBy: false,
    embeddingEnabled: true,
    auditLogEnabled: true,
    customAppearanceEnabled: true,
    manageProjectsEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    apiKeysEnabled: true,
    customDomainsEnabled: true,
    projectRolesEnabled: true,
    analyticsEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: true,
    agentsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: true,
}

export const licenseKeysService = (log: FastifyBaseLogger) => ({
    async requestTrial(request: CreateTrialLicenseKeyRequestBody): Promise<LicenseKeyEntity> {
        // Always return the lifetime enterprise license
        return LIFETIME_ENTERPRISE_LICENSE
    },
    async markAsActiviated(request: { key: string, platformId?: string }): Promise<void> {
        // No-op - no external calls needed
    },
    async getKey(license: string | undefined): Promise<LicenseKeyEntity | null> {
        // Always return the lifetime enterprise license
        return LIFETIME_ENTERPRISE_LICENSE
    },
    async verifyKeyOrReturnNull({ platformId, license }: { license: string | undefined, platformId: string }): Promise<LicenseKeyEntity | null> {
        // Always return valid lifetime enterprise license - no expiry check needed
        return LIFETIME_ENTERPRISE_LICENSE
    },
    async extendTrial({ email, days }: { email: string, days: number }): Promise<void> {
        // No-op - license never expires
    },
    async downgradeToFreePlan(platformId: string): Promise<void> {
        // No-op - never downgrade, always keep enterprise features
    },
    async applyLimits(platformId: string, key: LicenseKeyEntity): Promise<void> {
        // Always apply full enterprise features with unlimited everything
        await platformService.update({
            id: platformId,
            plan: {
                plan: PlanName.ENTERPRISE,
                licenseKey: LIFETIME_ENTERPRISE_LICENSE.key,
                licenseExpiresAt: LIFETIME_ENTERPRISE_LICENSE.expiresAt,
                ssoEnabled: true,
                environmentsEnabled: true,
                showPoweredBy: false,
                embeddingEnabled: true,
                auditLogEnabled: true,
                customAppearanceEnabled: true,
                globalConnectionsEnabled: true,
                customRolesEnabled: true,
                teamProjectsLimit: TeamProjectsLimit.UNLIMITED,
                managePiecesEnabled: true,
                mcpsEnabled: true,
                todosEnabled: true,
                tablesEnabled: true,
                activeFlowsLimit: undefined,
                projectsLimit: undefined,
                stripeSubscriptionId: undefined,
                stripeSubscriptionStatus: undefined,
                agentsEnabled: true,
                manageTemplatesEnabled: true,
                apiKeysEnabled: true,
                customDomainsEnabled: true,
                projectRolesEnabled: true,
                analyticsEnabled: true,
            },
        })
    },
})

const turnedOffFeatures: Omit<LicenseKeyEntity, 'id' | 'createdAt' | 'expiresAt' | 'activatedAt' | 'isTrial' | 'email' | 'customerName' | 'key'> = {
    ssoEnabled: true,
    analyticsEnabled: true,
    environmentsEnabled: true,
    showPoweredBy: false,
    embeddingEnabled: true,
    auditLogEnabled: true,
    customAppearanceEnabled: true,
    manageProjectsEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    apiKeysEnabled: true,
    customDomainsEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: true,
    projectRolesEnabled: true,
    agentsEnabled: true,
    mcpsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
}
