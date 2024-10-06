import dataset
import PIL.Image as Image
import tqdm
import torch.utils.data
import torch.utils
import torch.distributed
import torch
import pandas as pd
from pathlib import Path
import os

os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"


def main(lat, lng):
  # for testing other services
  return 1
  model = torch.load(
    './models/tf_efficientnetv2_l_in21k_f0_b8x2_e100_nrmse_devscse_attnlin_augs_decplus7_plus800eb_200ft/modelo_best.pth')
  model = model.eval()
  model = model.cuda()
  model = model.to(memory_format=torch.channels_last)
  models = [model]

  df = pd.read_csv('./data/features_metadata.csv')
  test_df = df[df.split == "test"].copy()
  test_df = test_df.groupby("chip_id").agg(list).reset_index()
  print(test_df)

  test_images_dir = Path('./data/test_features')
  test_dataset = dataset.DS(
      df=test_df,
      dir_features=test_images_dir,
  )
  test_sampler = None

  num_workers = min(16, 4)
  test_loader = torch.utils.data.DataLoader(
      test_dataset,
      batch_size=16,
      shuffle=False,
      sampler=test_sampler,
      collate_fn=None,
      num_workers=num_workers,
      pin_memory=False,
      persistent_workers=True,
      drop_last=False,
  )

  results = []
  with torch.no_grad():
    with tqdm.tqdm(test_loader, leave=False, mininterval=2) as pbar:
      for images, mask, target in pbar:
        images = images.cuda(non_blocking=True)
        mask = mask.cuda(non_blocking=True)
        logits = dataset.predict_tta(models, images, mask, ntta=args.tta)

        logits = logits.squeeze(1).cpu().numpy()

        for pred, chip_id in zip(logits, target):
          results.append((chip_id, pred))
        torch.cuda.synchronize()
  return results
