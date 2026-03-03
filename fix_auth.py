with open('app/page.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace(
    "'use client'",
    "'use client'\nimport { AuthButton } from '../lib/AuthButton'"
)

# Add auth button to hero
content = content.replace(
    '''        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-9 bg-red-600 rounded-full" />
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
              ReverseGPT
            </h1>
          </div>''',
    '''        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-9 bg-red-600 rounded-full" />
              <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
                ReverseGPT
              </h1>
            </div>
            <AuthButton />
          </div>'''
)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print('Done!')
