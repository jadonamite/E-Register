"use client";

export const RetentionList = ({ riskList }: { riskList: any[] }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-stone-100 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <h3 className="font-bold text-lg text-stone-900">Retention Focus</h3>
      </div>

      <div className="space-y-3">
        {riskList?.map((m: any) => (
          <div key={m._id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100/50">
            <div>
              <p className="font-bold text-sm text-stone-900">{m.name}</p>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{m.cell}</p>
            </div>
            <button className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-[10px] font-black uppercase hover:bg-stone-900 hover:text-white transition-colors">
              Contact
            </button>
          </div>
        ))}
        {(!riskList || riskList.length === 0) && (
          <div className="p-8 text-center border-2 border-dashed border-stone-100 rounded-2xl">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">All Clear!</p>
          </div>
        )}
      </div>
    </div>
  );
};