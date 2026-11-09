import type { CreativeAsset, CreativeUsage, CreativeVersion, ReviewStatus } from './creative-model';
import c1 from '@/assets/creator-1.jpg';
import c2 from '@/assets/creator-2.jpg';
import c3 from '@/assets/creator-3.jpg';
import c4 from '@/assets/creator-4.jpg';
import a1 from '@/assets/concept-1.jpg';
import a2 from '@/assets/concept-2.jpg';
import a3 from '@/assets/concept-3.jpg';
import a4 from '@/assets/concept-4.jpg';
import m1 from '@/assets/music-1.jpg';
import m2 from '@/assets/music-2.jpg';
import m3 from '@/assets/music-3.jpg';
import m4 from '@/assets/music-4.jpg';
import b1 from '@/assets/brand-1.jpg';
import b2 from '@/assets/brand-2.jpg';
import b3 from '@/assets/brand-3.jpg';
export const CREATIVE_PREVIEWS = [c1,c2,c3,c4,a1,a2,a3,a4,m1,m2,m3,m4,b1,b2,b3];
export function makeVersion(preview: string, number = 1, review: ReviewStatus = 'Draft'): CreativeVersion {
 return {number, preview, format:'Image',ratio:'1:1',size:820000,width:768,height:768,createdAt:'2026-11-06T09:00:00Z',by:'David Kim',change:number===1?'Original creative draft':number===2?'Reworked opening and creator direction':'Updated native captions and final cut',review,approval:review==='Approved'?'Human Approved':null,...(review==='Approved'?{approvedBy:'Maya Chen'}:{}),clientApproved:false,shared:false,technical:false,material:number>1,validated:true,warning:false,comments:[],audit:review==='Approved'?[{at:'2026-11-06T10:00:00Z',actor:'Maya Chen',action:`Human approved V${number}`}]:[]};
}
export function seedCreatives(): CreativeAsset[] {
 const names=['“Drop the beat” 15s vertical','Creator remix montage 30s','“Any song → video” static','Holiday teaser (concept)','Lifestyle creator demo','Studio behind the scenes','Freebeat UGC Concept','New Feature Launch','Creator duet concept','Your soundtrack, your story','Beat-sync teaser loop','POV: your song becomes a video','Search ad copy set v4','Retargeting carousel','Morning brew hero'];
 return names.map((name,i)=>{
 const count=i===0||i===1||i===6?3:1;
 const status:ReviewStatus=i<3||i===4||i===7||i>=12?'Approved':i===3||i===9?'Draft':i===5||i===6||i===10?'In Review':'Changes Requested';
 const versions=Array.from({length:count},(_,n)=>makeVersion(CREATIVE_PREVIEWS[i]??c1,n+1,n===count-1?status:n===0?'Approved':'Changes Requested'));
 for(const v of versions){v.format=[0,1,4,5,6,8,10,11].includes(i)?'Video':'Image';v.ratio=v.format==='Video'?'9:16':i===7?'4:5':'1:1';if(v.format==='Video')v.duration=i===1?30:15;}
 const asset:CreativeAsset={id:i<12?`A-${String(i+1).padStart(2,'0')}`:i===12?'B-01':i===13?'B-02':'D-01',clientId:i<12?'freebeat':i<14?'clientb':'direct',name,source:i<6||i>=12?'Uploaded':'AI Generated',channel:i===11?'TikTok Ads':'Meta',tags:i<6?['Creator','Launch']:['Concept','AI'],current:count,reviewer:'david',clientRequired:i===7,versions};
 if(i<3){const v=versions[versions.length-1];if(v)v.shared=true;}
 if(i===7){const v=versions[0];if(v)v.shared=true;}
 if(i===2){const v=makeVersion(CREATIVE_PREVIEWS[i]??c1,2,'Approved');v.technical=true;v.material=false;v.ratio='4:5';v.width=768;v.height=960;v.sourceVersion=1;v.approval='Auto Approved';v.approvedBy='System / Creative Agent';v.change='Technical variant: 4:5 padding, original content preserved';v.audit=[{at:'2026-11-06T11:00:00Z',actor:'Maya Chen',action:'Enabled policy v1 for this demonstration'},{at:'2026-11-06T11:01:00Z',actor:'System / Creative Agent',action:'Auto Approved — Policy Check Passed · Approved-source technical format adaptation · Policy v1 · Source A-03 V1',checks:['Admin authorization','Approved source','Permitted padding','No substantive changes','Placement validation','No client review outstanding','No warning'].map(name=>({name,passed:true}))}];asset.versions.push(v);asset.current=2;}
 if(i===11){const v=versions[0];if(v){v.material=true;v.audit.push({at:v.createdAt,actor:'System / Creative Agent',action:'Human Review Required — new product claim outside technical adaptation policy',checks:[{name:'No substantive copy or claim change',passed:false}]});}}
 return asset;
 });
}
export function seedUsage():CreativeUsage[]{return [
 {creativeId:'A-01',version:3,campaignId:'CMP-FB-REELS',adId:'AD-RC-01'},
 {creativeId:'A-01',version:3,campaignId:'CMP-FB-SPRING',adId:'AD-SP-01'},
 {creativeId:'A-01',version:3,campaignId:'CMP-G-UAC',adId:'AD-GU-01'},
 {creativeId:'A-02',version:3,campaignId:'CMP-FB-REELS',adId:'AD-RC-02'},
 {creativeId:'A-02',version:3,campaignId:'CMP-FB-SPRING',adId:'AD-SP-02'},
 {creativeId:'A-03',version:1,campaignId:'CMP-FB-CONV',adId:'AD-CD-03'},
 {creativeId:'A-03',version:1,campaignId:'CMP-FB-SPRING',adId:'AD-SP-03'},
 {creativeId:'B-01',version:1,campaignId:'CMP-B-SEARCH',adId:'AD-BS-01'},
 {creativeId:'B-02',version:1,campaignId:'CMP-B-RETARGET',adId:'AD-BR-01'}];}
