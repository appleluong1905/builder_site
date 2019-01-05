<div class="clearfix">
	<a href="#" class="close"><span class="fui-cross-inverted"></span></a>
	<?php
	if ($data['data']['siteSettings_ftpPath'] != "/")
	{
		$temp = explode("/", $data['data']['siteSettings_ftpPath']);
		array_pop($temp);
		$path = implode("/", $temp);
		?>
		<a href="<?php echo ($path == '') ? "/" : $path; ?>" class="back link"><span class="fui-arrow-left"></span> Up one level</a>
		<?php
	}
	?>
</div>
<ul>
	<?php
	foreach ($data['list'] as $item)
	{
		//filter out hidden items
		if ($item[0] != '.')
		{
			$path_parts= pathinfo($item);
			if (isset($path_parts["extension"]))
			{
				?>
				<li><a><span class="fui-document"></span>&nbsp; <?php echo $item;?></a></li>
				<?php
			}
			else
			{
				?>
				<li><a href="<?php echo $item; ?>" class="link"><span class="fui-folder"></span>&nbsp; <?php echo $item;?></a></li>
				<?php
			}
		}
	}
	?>
</ul>