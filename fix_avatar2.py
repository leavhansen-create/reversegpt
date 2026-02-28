with open('app/chat/page.tsx', 'r') as f:
    content = f.read()

old = '''  return (
    <div
      className="rounded-full flex-shrink-0 border select-none overflow-hidden"
      style={{
        width: dims,
        height: dims,
        borderColor: professor.avatarBorder,
        boxShadow: `0 0 0 1px ${professor.avatarBorder}22`,
      }}
    >
      <img
        src={imgSrc}
        alt={professor.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'
          target.parentElement!.style.background = professor.avatarBg
          target.parentElement!.style.display = 'flex'
          target.parentElement!.style.alignItems = 'center'
          target.parentElement!.style.justifyContent = 'center'
          target.parentElement!.style.color = professor.avatarText
          target.parentElement!.style.fontSize = fontSize + 'px'
          target.parentElement!.style.fontWeight = 'bold'
          target.parentElement!.innerHTML = professor.initials
        }}
      />
    </div>
  )'''

new = '''  return (
    <img
      src={imgSrc}
      alt={professor.name}
      className="flex-shrink-0 select-none"
      style={{ width: dims, height: dims, objectFit: 'contain' }}
    />
  )'''

content = content.replace(old, new)

with open('app/chat/page.tsx', 'w') as f:
    f.write(content)

print('Done!')
