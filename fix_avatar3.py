with open('app/chat/page.tsx', 'r') as f:
    content = f.read()

old = '''  return (
    <img
      src={imgSrc}
      alt={professor.name}
      className="flex-shrink-0 select-none"
      style={{ width: dims, height: dims, objectFit: 'contain' }}
    />
  )'''

new = '''  const [imgFailed, setImgFailed] = React.useState(false)

  if (imgFailed) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold flex-shrink-0 border select-none"
        style={{
          width: dims,
          height: dims,
          fontSize,
          background: professor.avatarBg,
          borderColor: professor.avatarBorder,
          color: professor.avatarText,
          letterSpacing: '0.01em',
        }}
      >
        {professor.initials}
      </div>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={professor.name}
      className="flex-shrink-0 select-none"
      style={{ width: dims, height: dims, objectFit: 'contain' }}
      onError={() => setImgFailed(true)}
    />
  )'''

content = content.replace(old, new)

with open('app/chat/page.tsx', 'w') as f:
    f.write(content)

print('Done!')
