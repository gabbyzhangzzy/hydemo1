import { CAMPAIGNS,DEFAULT_FILTERS,adBreakdown,filteredRows } from './analytics-data';
import type { State } from './store';
import type { CreativeAsset,CreativeVersion,DeliveryStatus } from './creative-model';
import { effectiveApproval } from './creative-model';
export function versionUsage(s:State,a:CreativeAsset,v:CreativeVersion){return s.creativeUsage.filter(u=>u.creativeId===a.id&&u.version===v.number).map(u=>{const campaign=CAMPAIGNS.find(c=>c.id===u.campaignId);const ad=campaign?.ads.find(ad=>ad.id===u.adId);const status:DeliveryStatus=u.adId?(campaign?.status==='Completed'?'Completed':ad?.status==='Paused'||campaign?.status==='Paused'?'Paused':'Active'):effectiveApproval(a,v)&&v.validated&&!v.warning?'Ready to Launch':'Scheduled / Pending';return {...u,campaign,ad,status};});}
export function deliverySummary(s:State,a:CreativeAsset,v:CreativeVersion){const usage=versionUsage(s,a,v);if(!usage.length)return 'Not Assigned';return [...new Set(usage.map(u=>u.status))].map(status=>`${usage.filter(u=>u.status===status).length} ${status}`).join(' · ');}
export function creativePerformance(s:State,a:CreativeAsset,v:CreativeVersion){const rows=filteredRows([a.clientId],{...DEFAULT_FILTERS,days:90});return versionUsage(s,a,v).filter(u=>u.adId).flatMap(u=>adBreakdown(u.campaignId,rows).filter(r=>r.ad.id===u.adId));}
