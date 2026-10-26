document.getElementById("copy").addEventListener("click",function(){var b=this,u=location.href;function ok(){b.textContent="লিংক কপি হয়েছে ✓";setTimeout(function(){b.textContent="লিংক কপি করুন"},2200)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(ok,function(){prompt("লিংক:",u)})}else{prompt("লিংক:",u)}});
