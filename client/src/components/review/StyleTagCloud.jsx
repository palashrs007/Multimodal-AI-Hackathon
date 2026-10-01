import React from 'react';
import { Tag } from 'lucide-react';

export function StyleTagCloud({ places = [] }) {
  const tagCount = new Map();

  places.forEach((p) => {
    (p.style_tags || []).forEach((tag) => {
      const clean = tag.toLowerCase().trim();
      tagCount.set(clean, (tagCount.get(clean) || 0) + 1);
    });
  });

  const tags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]);

  if (tags.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-sm space-y-2">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
        <Tag className="w-3.5 h-3.5 text-coral-500" />
        <span>Synthesized Visual Mood & Aesthetic Profile</span>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {tags.map(([tag, count]) => (
          <span
            key={tag}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-900 border border-brand-200/70"
          >
            <span>#{tag}</span>
            {count > 1 && (
              <span className="text-[10px] text-brand-600 bg-brand-100 px-1.5 py-0.2 rounded-full font-mono">
                {count}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default StyleTagCloud;
