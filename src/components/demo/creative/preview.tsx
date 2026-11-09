import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import type { CreativeVersion } from '@/lib/demo/creative-model';
import { readCreativeFile } from '@/lib/demo/creative-files';
export function CreativePreview({version,large=false}:{version:CreativeVersion;large?:boolean}){
 const [local,setLocal]=useState<string>();const [error,setError]=useState(false);
 useEffect(()=>{let active=true;let url:string|undefined;setLocal(undefined);setError(false);if(version.mediaKey)readCreativeFile(version.mediaKey).then(blob=>{if(!active)return;if(blob){url=URL.createObjectURL(blob);setLocal(url);}else setError(true);}).catch(()=>{if(active)setError(true);});return()=>{active=false;if(url)URL.revokeObjectURL(url);};},[version.mediaKey]);
 return <div className={`relative flex aspect-square w-full items-center justify-center overflow-hidden bg-secondary ${large?'max-h-[480px]':''}`}>
 {local&&version.format==='Video'?<video src={local} poster={version.preview} controls={large} muted={!large} preload="metadata" className="h-full w-full object-contain"/>:<img src={local??version.preview} alt="Creative preview" width={768} height={768} loading="lazy" className={`h-full w-full ${large?'object-contain':'object-cover'}`}/>}
 {!local&&version.format==='Video'&&<span className="absolute bottom-3 left-3 flex items-center gap-1 rounded bg-ai-panel/90 px-2 py-1 text-xs text-ai-panel-foreground"><Play className="size-3"/>{version.duration??15}s · Illustrative storyboard</span>}
 {error&&<span className="absolute bottom-2 rounded bg-card p-2 text-xs text-danger">Local file unavailable · illustrative fallback</span>}
 </div>;
}
