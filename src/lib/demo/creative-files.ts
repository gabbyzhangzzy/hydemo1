function database():Promise<IDBDatabase> {
 return new Promise((resolve,reject)=>{const r=indexedDB.open('hellyeah-creative-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
export async function saveCreativeFile(key:string,file:Blob){const db=await database();try{await new Promise<void>((resolve,reject)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put(file,key);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}finally{db.close();}}
export async function readCreativeFile(key:string):Promise<Blob|undefined>{const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('files').objectStore('files').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function inspectCreativeFile(file:File){
 if(!file.type.startsWith('image/')&&!file.type.startsWith('video/'))throw new Error('Unsupported file. Choose an image or video.');
 if(file.size>100*1024*1024)throw new Error('File exceeds the 100 MB local demo limit.');
 const url=URL.createObjectURL(file);
 try{return await new Promise<{width:number;height:number;duration?:number}>((resolve,reject)=>{
 const timer=setTimeout(()=>reject(new Error('Could not decode file metadata. Retry with a supported file.')),10000);
 if(file.type.startsWith('image/')){const im=new Image();im.onload=()=>{clearTimeout(timer);resolve({width:im.naturalWidth,height:im.naturalHeight});};im.onerror=()=>{clearTimeout(timer);reject(new Error('Image could not be decoded.'));};im.src=url;}
 else{const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>{clearTimeout(timer);resolve({width:v.videoWidth,height:v.videoHeight,duration:v.duration});v.removeAttribute('src');v.load();};v.onerror=()=>{clearTimeout(timer);reject(new Error('Video could not be decoded.'));};v.src=url;}
 });}finally{URL.revokeObjectURL(url);}
}
