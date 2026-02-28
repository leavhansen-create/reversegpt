with open('app/chat/page.tsx', 'r') as f:
    content = f.read()

# Remove avatar from header, keep name
content = content.replace(
    '''            <ProfessorAvatar professor={professor} size="sm" />
            <span
              className="text-sm font-medium flex-shrink-0"
              style={{ color: professor.accentColor }}
            >
              {professor.name}''',
    '''            <span
              className="text-sm font-medium flex-shrink-0"
              style={{ color: professor.accentColor }}
            >
              {professor.name}'''
)

# Make message avatar larger
content = content.replace(
    'const dims = size === \'sm\' ? 36 : size === \'lg\' ? 64 : 48',
    'const dims = size === \'sm\' ? 48 : size === \'lg\' ? 72 : 56'
)

with open('app/chat/page.tsx', 'w') as f:
    f.write(content)

print('Done!')
