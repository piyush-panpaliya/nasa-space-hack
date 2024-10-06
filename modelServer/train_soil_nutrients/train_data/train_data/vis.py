import numpy as np 

for i in range(50):
    dat = np.load(f'{i}.npz')
    data = dat['data']
    mask = dat['mask']

    print("Data shape: ",data.shape)
    print("Maks shape: ",mask.shape)
    print("------------------------")