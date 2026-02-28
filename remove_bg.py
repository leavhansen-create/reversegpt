from PIL import Image
import os

folder = 'public/professors'
for filename in os.listdir(folder):
    if not filename.endswith('.png'):
        continue
    path = os.path.join(folder, filename)
    img = Image.open(path).convert('RGBA')
    data = img.getdata()
    new_data = []
    for r, g, b, a in data:
        if r > 200 and g > 200 and b > 200:
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)
    img.save(path)
    print(f'Processed {filename}')

print('All done!')
